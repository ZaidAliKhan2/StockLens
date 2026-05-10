const { GoogleGenerativeAI } = require('@google/generative-ai');

const TIMEOUT_MS = 8000;
const FEATURE_TYPES = [
  'price-history',
  'stats',
  'moving-averages',
  'best-worst-month',
  'green-days',
  'volume-spike',
  'ma-crossover',
  'compare',
  'correlation',
  'screener',
  'sector-volatility',
];

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
].filter(Boolean);

function value(data, key, fallback = 'N/A') {
  const result = data && data[key];
  return result === undefined || result === null || result === '' ? fallback : result;
}

function money(data, key) {
  const result = value(data, key);
  return result === 'N/A' ? result : `$${result}`;
}

function compactJson(input) {
  if (input === undefined || input === null) {
    return 'N/A';
  }

  if (typeof input === 'string') {
    return input;
  }

  try {
    return JSON.stringify(input);
  } catch (error) {
    return 'N/A';
  }
}

function commonInstruction(prompt) {
  return [
    prompt,
    '',
    'Speak simply, as if explaining to someone with no finance background.',
    'Use only the supplied data, keep the answer to 2-4 plain sentences, and avoid giving any financial advice.',
  ].join('\n');
}

function buildPrompt(featureType, resultData = {}) {
  const templates = {
    'price-history': () => commonInstruction(
      `A stock's daily closing prices are shown below for a specific period.
Ticker: ${value(resultData, 'ticker')}, Period: ${value(resultData, 'start')} to ${value(resultData, 'end')}
First price: ${money(resultData, 'firstPrice')}, Last price: ${money(resultData, 'lastPrice')}, Change: ${value(resultData, 'changePct')}%
In 2-3 sentences, describe what the price trend looks like during this period.
Do not give financial advice.`,
    ),
    stats: () => commonInstruction(
      `Stock analysis data for ${value(resultData, 'ticker')} from ${value(resultData, 'start')} to ${value(resultData, 'end')}:
Period High: ${money(resultData, 'high')}, Period Low: ${money(resultData, 'low')}, Average Close: ${money(resultData, 'avgClose')}
Volatility score: ${value(resultData, 'volatility')}, 52-Week High: ${money(resultData, 'w52High')}, 52-Week Low: ${money(resultData, 'w52Low')}
In 2-3 sentences, summarize this stock's behavior during this period.
Do not give financial advice.`,
    ),
    'moving-averages': () => commonInstruction(
      `Moving average data for ${value(resultData, 'ticker')}:
The 20-day MA and 50-day MA are shown over the period ${value(resultData, 'start')} to ${value(resultData, 'end')}.
Latest 20-day MA: ${money(resultData, 'ma20')}, Latest 50-day MA: ${money(resultData, 'ma50')}.
Is the 20-day MA above or below the 50-day MA right now? What does that typically suggest?
2-3 sentences, no financial advice.`,
    ),
    'best-worst-month': () => commonInstruction(
      `For ${value(resultData, 'ticker')}, the best month was ${value(resultData, 'bestMonth')} with a price range of ${value(resultData, 'bestPct')}%.
The worst month was ${value(resultData, 'worstMonth')} with a range of ${value(resultData, 'worstPct')}%.
In 2 sentences, describe what this tells us about this stock's monthly volatility pattern.
No financial advice.`,
    ),
    'green-days': () => commonInstruction(
      `${value(resultData, 'count')} stocks showed ${value(resultData, 'minDays')}+ consecutive days of price increases in the last ${value(resultData, 'lookback')} days.
Top results: ${compactJson(value(resultData, 'topResults'))}
In 2-3 sentences, explain what consecutive green days can indicate and whether ${value(resultData, 'count')} stocks showing this pattern simultaneously is notable. No financial advice.`,
    ),
    'volume-spike': () => commonInstruction(
      `The following stocks showed trading volume ${value(resultData, 'multiplier')}x above their 30-day average:
Top results: ${compactJson(value(resultData, 'topResults'))}
In 2-3 sentences, explain what a volume spike typically signals in stock markets.
No financial advice.`,
    ),
    'ma-crossover': () => commonInstruction(
      `${value(resultData, 'count')} stocks showed a moving average crossover (short MA: ${value(resultData, 'shortMA')}-day, long MA: ${value(resultData, 'longMA')}-day) in the past ${value(resultData, 'lookback')} days.
Top results: ${compactJson(value(resultData, 'topResults'))}
In 2-3 sentences, explain what a moving average crossover means and whether bullish or bearish crossovers dominate in these results. No financial advice.`,
    ),
    compare: () => commonInstruction(
      `Comparing ${value(resultData, 'tickers')} from ${value(resultData, 'start')} to ${value(resultData, 'end')}:
Growth rates: ${value(resultData, 'growthSummary')}
SPY (market benchmark) growth: ${value(resultData, 'spyGrowth')}%
In 2-3 sentences, summarize how these stocks performed relative to each other and to the market benchmark. No financial advice.`,
    ),
    correlation: () => commonInstruction(
      `The price correlation between ${value(resultData, 'ticker1')} and ${value(resultData, 'ticker2')} from ${value(resultData, 'start')} to ${value(resultData, 'end')} is ${value(resultData, 'coefficient')}.
A correlation of 1.0 means they move identically; -1.0 means they move opposite; 0 means no relationship.
In 2 sentences, explain what this correlation value means for these two stocks. No financial advice.`,
    ),
    screener: () => commonInstruction(
      `${value(resultData, 'count')} stocks matched the screening criteria: sector=${value(resultData, 'sector')}, min volume=${value(resultData, 'minVolume')}, price range=${money(resultData, 'minPrice')}-${money(resultData, 'maxPrice')}, min growth=${value(resultData, 'minGrowthPct')}%.
Top 3 by volatility rank: ${compactJson(value(resultData, 'topResults'))}
In 2-3 sentences, describe what this set of stocks has in common and what the screener results suggest. No financial advice.`,
    ),
    'sector-volatility': () => commonInstruction(
      `Sector volatility results are shown for sector=${value(resultData, 'sector')} from ${value(resultData, 'start')} to ${value(resultData, 'end')}.
Top results: ${compactJson(value(resultData, 'topResults'))}
In 2-3 sentences, explain what higher volatility means in this sector comparison. No financial advice.`,
    ),
  };

  const template = templates[featureType];
  return template ? template() : commonInstruction(`Explain this StockLens result: ${compactJson(resultData)}`);
}

async function getExplanation(featureType, resultData) {
  try {
    if (!genAI) {
      return null;
    }

    const prompt = buildPrompt(featureType, resultData);
    const generationPromise = (async () => {
      let lastError = null;

      for (const modelName of GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (error) {
          lastError = error;
          if (process.env.NODE_ENV !== 'production') {
            console.error(`[AI MODEL FAILED] ${modelName}: ${error.message}`);
          }
        }
      }

      throw lastError || new Error('No Gemini model available');
    })();

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), TIMEOUT_MS);
    });

    return await Promise.race([generationPromise, timeoutPromise]);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AI ERROR]', error.message);
    }

    return null;
  }
}

module.exports = {
  FEATURE_TYPES,
  buildPrompt,
  getExplanation,
};
