const { sql, getPool } = require('../config/db');
const {
  comparePassword,
  generateOTP,
  generateToken,
  hashPassword,
  sendOTPEmail,
} = require('./auth.helpers');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function success(res, statusCode, message, data) {
  const response = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

function fail(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function toUser(row) {
  return {
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
  };
}

function isValidRegistration(fullName, email, password) {
  return Boolean(
    fullName
      && String(fullName).trim()
      && email
      && emailRegex.test(email)
      && password
      && String(password).length >= 8,
  );
}

async function insertOTP(request, email, otpCode) {
  const expiresMinutes = Number.parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);

  await request
    .input('otpEmail', sql.VarChar(255), email)
    .input('otpCode', sql.VarChar(6), otpCode)
    .input('expiresMinutes', sql.Int, Number.isFinite(expiresMinutes) ? expiresMinutes : 10)
    .query(`
      INSERT INTO dbo.OTPStore (email, otp_code, expires_at)
      VALUES (@otpEmail, @otpCode, DATEADD(MINUTE, @expiresMinutes, GETDATE()));
    `);
}

async function register(req, res, next) {
  try {
    const fullName = String(req.body.full_name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!isValidRegistration(fullName, email, password)) {
      return fail(res, 400, 'Full name, valid email, and password of at least 8 characters are required');
    }

    const pool = await getPool();
    const existingResult = await pool.request()
      .input('email', sql.VarChar(255), email)
      .query(`
        SELECT TOP (1) user_id, email, is_verified
        FROM dbo.Users
        WHERE email = @email;
      `);

    const existingUser = existingResult.recordset[0];
    if (existingUser && existingUser.is_verified) {
      return fail(res, 409, 'Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const otpCode = generateOTP();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      if (existingUser) {
        await new sql.Request(transaction)
          .input('email', sql.VarChar(255), email)
          .query('DELETE FROM dbo.OTPStore WHERE email = @email; DELETE FROM dbo.Users WHERE email = @email;');
      }

      await new sql.Request(transaction)
        .input('email', sql.VarChar(255), email)
        .input('passwordHash', sql.VarChar(255), passwordHash)
        .input('fullName', sql.VarChar(150), fullName)
        .query(`
          INSERT INTO dbo.Users (email, password_hash, full_name, is_verified)
          VALUES (@email, @passwordHash, @fullName, 0);
        `);

      await new sql.Request(transaction)
        .input('email', sql.VarChar(255), email)
        .query('DELETE FROM dbo.OTPStore WHERE email = @email AND used = 0;');

      await insertOTP(new sql.Request(transaction), email, otpCode);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await sendOTPEmail(email, otpCode, fullName);
    return success(res, 201, 'Verification code sent to your email');
  } catch (error) {
    console.error('Register error:', error);
    return next(error);
  }
}

async function verifyOTP(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const otpCode = String(req.body.otp_code || '').trim();

    if (!emailRegex.test(email) || !/^\d{6}$/.test(otpCode)) {
      return fail(res, 400, 'Invalid or expired OTP');
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    let user;

    await transaction.begin();

    try {
      const otpResult = await new sql.Request(transaction)
        .input('email', sql.VarChar(255), email)
        .input('otpCode', sql.VarChar(6), otpCode)
        .query(`
          SELECT TOP (1) otp_id
          FROM dbo.OTPStore WITH (UPDLOCK, ROWLOCK)
          WHERE email = @email
            AND otp_code = @otpCode
            AND used = 0
            AND expires_at > GETDATE()
          ORDER BY created_at DESC, otp_id DESC;
        `);

      const otp = otpResult.recordset[0];
      if (!otp) {
        await transaction.rollback();
        return fail(res, 400, 'Invalid or expired OTP');
      }

      await new sql.Request(transaction)
        .input('otpId', sql.Int, otp.otp_id)
        .query('UPDATE dbo.OTPStore SET used = 1 WHERE otp_id = @otpId;');

      const updateResult = await new sql.Request(transaction)
        .input('email', sql.VarChar(255), email)
        .query(`
          UPDATE dbo.Users
          SET is_verified = 1
          WHERE email = @email;
        `);

      if (updateResult.rowsAffected[0] !== 1) {
        await transaction.rollback();
        return fail(res, 400, 'Invalid or expired OTP');
      }

      const userResult = await new sql.Request(transaction)
        .input('email', sql.VarChar(255), email)
        .query(`
          SELECT TOP (1) user_id, email, full_name, role
          FROM dbo.Users
          WHERE email = @email;
        `);

      user = userResult.recordset[0];
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (!user) {
      return fail(res, 400, 'Invalid or expired OTP');
    }

    const token = generateToken(user);
    return success(res, 200, 'Email verified successfully', {
      token,
      user: toUser(user),
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!emailRegex.test(email) || !password) {
      return fail(res, 401, 'Invalid credentials');
    }

    const pool = await getPool();
    const userResult = await pool.request()
      .input('email', sql.VarChar(255), email)
      .query(`
        SELECT TOP (1) user_id, email, password_hash, full_name, role, is_verified
        FROM dbo.Users
        WHERE email = @email;
      `);

    const user = userResult.recordset[0];
    if (!user) {
      return fail(res, 401, 'Invalid credentials');
    }

    if (!user.is_verified) {
      return fail(res, 403, 'Please verify your email first');
    }

    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return fail(res, 401, 'Invalid credentials');
    }

    await pool.request()
      .input('userId', sql.Int, user.user_id)
      .query('UPDATE dbo.Users SET last_login = GETDATE() WHERE user_id = @userId;');

    const publicUser = toUser(user);
    const token = generateToken(publicUser);

    return success(res, 200, 'Login successful', {
      token,
      user: publicUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(error);
  }
}

async function resendOTP(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!emailRegex.test(email)) {
      return fail(res, 400, 'Valid email is required');
    }

    const pool = await getPool();
    const userResult = await pool.request()
      .input('email', sql.VarChar(255), email)
      .query(`
        SELECT TOP (1) user_id, email, full_name, is_verified
        FROM dbo.Users
        WHERE email = @email;
      `);

    const user = userResult.recordset[0];
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    if (user.is_verified) {
      return fail(res, 400, 'Account already verified');
    }

    const otpCode = generateOTP();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      await new sql.Request(transaction)
        .input('email', sql.VarChar(255), email)
        .query('DELETE FROM dbo.OTPStore WHERE email = @email;');

      await insertOTP(new sql.Request(transaction), email, otpCode);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await sendOTPEmail(email, otpCode, user.full_name);
    return success(res, 200, 'New verification code sent');
  } catch (error) {
    console.error('Resend OTP error:', error);
    return next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const pool = await getPool();
    const userResult = await pool.request()
      .input('userId', sql.Int, req.user.user_id)
      .query(`
        SELECT TOP (1) user_id, email, full_name, role, is_verified, created_at, last_login
        FROM dbo.Users
        WHERE user_id = @userId;
      `);

    const user = userResult.recordset[0];
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    return success(res, 200, 'User profile loaded', {
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_verified: Boolean(user.is_verified),
        created_at: user.created_at,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return next(error);
  }
}

module.exports = {
  register,
  verifyOTP,
  login,
  resendOTP,
  getMe,
};
