const Transaction = require('../models/Transaction');
const Grant = require('../models/Grant');
const Donor = require('../models/Donor');
const AuditLog = require('../models/AuditLog');

/**
 * AI-Powered Transaction Analysis Service
 * Uses Google Gemini API for intelligent fraud detection and risk assessment.
 * Falls back to rule-based analysis if Gemini API is unavailable.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ============================================
// GEMINI AI ANALYSIS
// ============================================

/**
 * Analyze a transaction using Gemini AI for fraud risk assessment
 */
async function analyzeTransactionWithAI(transaction, historicalContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null; // Fall back to rule-based
  }

  const prompt = `You are a forensic accounting AI assistant for the Reformed Church in Zimbabwe's donor fund tracking system. Analyze this transaction for potential fraud risk, anomalies, or compliance issues.

TRANSACTION:
- Type: ${transaction.type}
- Amount: $${transaction.amount} USD
- Category: ${transaction.category}
- Description: ${transaction.description}
- Payment Method: ${transaction.paymentMethod}
- Date: ${transaction.date}
- Congregation: ${transaction.congregation || 'Not specified'}
- Initiated By: ${transaction.initiatedBy || 'Unknown'}

HISTORICAL CONTEXT:
- Average transaction amount in this category: $${historicalContext.avgAmount}
- Median transaction amount: $${historicalContext.medianAmount}
- Max transaction amount in history: $${historicalContext.maxAmount}
- Total transactions this month: ${historicalContext.monthlyCount}
- Average monthly transactions: ${historicalContext.avgMonthlyCount}
- Flagged transactions ratio: ${historicalContext.flaggedRatio}%
- This donor's total donations: $${historicalContext.donorTotal}
- This grant's remaining balance: $${historicalContext.grantRemaining}
- This grant's total budget: $${historicalContext.grantTotal}

Respond ONLY in valid JSON format with these fields:
{
  "riskScore": <number 0-100, where 0=no risk, 100=highest risk>,
  "riskLevel": "<Low|Medium|High|Critical>",
  "shouldFlag": <true/false>,
  "flagReason": "<reason if should flag, null otherwise>",
  "anomalies": ["<list of detected anomalies>"],
  "recommendations": ["<list of recommendations>"],
  "complianceIssues": ["<list of compliance concerns>"],
  "summary": "<brief 1-2 sentence analysis summary>"
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Gemini AI analysis error:', error.message);
    return null;
  }
}

/**
 * Get historical context for AI analysis
 */
async function getHistoricalContext(transaction) {
  const categoryTxns = await Transaction.find({
    category: transaction.category,
    status: 'Completed'
  }).select('amount');

  const amounts = categoryTxns.map(t => t.amount).sort((a, b) => a - b);
  const sum = amounts.reduce((a, b) => a + b, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCount = await Transaction.countDocuments({ date: { $gte: monthStart } });

  const totalMonths = 12;
  const totalTxns = await Transaction.countDocuments({ status: 'Completed' });
  const flaggedTxns = await Transaction.countDocuments({ isFlagged: true });

  let donorTotal = 0;
  let grantRemaining = 0;
  let grantTotal = 0;

  if (transaction.donor) {
    const donor = await Donor.findById(transaction.donor);
    donorTotal = donor?.totalDonated || 0;
  }
  if (transaction.grant) {
    const grant = await Grant.findById(transaction.grant);
    grantRemaining = grant?.amountRemaining || 0;
    grantTotal = grant?.totalAmount || 0;
  }

  return {
    avgAmount: amounts.length > 0 ? Math.round(sum / amounts.length) : 0,
    medianAmount: amounts.length > 0 ? amounts[Math.floor(amounts.length / 2)] : 0,
    maxAmount: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
    monthlyCount,
    avgMonthlyCount: Math.round(totalTxns / totalMonths),
    flaggedRatio: totalTxns > 0 ? Math.round((flaggedTxns / totalTxns) * 100) : 0,
    donorTotal,
    grantRemaining,
    grantTotal
  };
}


// ============================================
// RULE-BASED ANALYSIS (Fallback)
// ============================================

/**
 * Rule-based transaction analysis when AI is unavailable.
 * Based on COSO framework control activities and forensic accounting red flags.
 */
async function analyzeTransactionWithRules(transaction, historicalContext) {
  const anomalies = [];
  const recommendations = [];
  const complianceIssues = [];
  let riskScore = 0;

  // Rule 1: Amount significantly exceeds category average (Benford's Law inspired)
  if (historicalContext.avgAmount > 0) {
    const ratio = transaction.amount / historicalContext.avgAmount;
    if (ratio > 3) {
      riskScore += 30;
      anomalies.push(`Transaction amount ($${transaction.amount}) is ${ratio.toFixed(1)}x the category average ($${historicalContext.avgAmount})`);
      recommendations.push('Verify transaction with supporting documentation');
    } else if (ratio > 2) {
      riskScore += 15;
      anomalies.push(`Transaction amount is ${ratio.toFixed(1)}x the category average`);
    }
  }

  // Rule 2: Transaction exceeds grant remaining balance
  if (transaction.type === 'Expenditure' && historicalContext.grantTotal > 0) {
    if (transaction.amount > historicalContext.grantRemaining) {
      riskScore += 35;
      anomalies.push(`Expenditure ($${transaction.amount}) exceeds grant remaining balance ($${historicalContext.grantRemaining})`);
      complianceIssues.push('Transaction exceeds available grant funds - potential over-expenditure');
      recommendations.push('Reject or seek additional grant approval before processing');
    }
    const utilizationAfter = ((historicalContext.grantTotal - historicalContext.grantRemaining + transaction.amount) / historicalContext.grantTotal) * 100;
    if (utilizationAfter > 90) {
      riskScore += 10;
      anomalies.push(`Grant utilization will reach ${utilizationAfter.toFixed(0)}% after this transaction`);
    }
  }

  // Rule 3: Unusual payment method for amount size
  if (transaction.amount > 5000 && transaction.paymentMethod === 'Cash') {
    riskScore += 25;
    anomalies.push('Large cash transaction detected - cash payments over $5,000 require additional scrutiny');
    complianceIssues.push('Cash transactions above $5,000 should use bank transfer per policy');
    recommendations.push('Use bank transfer for large amounts to maintain audit trail');
  }

  // Rule 4: Round number transactions (common fraud indicator)
  if (transaction.amount >= 1000 && transaction.amount % 1000 === 0) {
    riskScore += 8;
    anomalies.push('Round number transaction - may indicate estimation rather than actual cost');
  }

  // Rule 5: Unusually high monthly transaction volume
  if (historicalContext.avgMonthlyCount > 0 && historicalContext.monthlyCount > historicalContext.avgMonthlyCount * 1.5) {
    riskScore += 12;
    anomalies.push(`Monthly transaction count (${historicalContext.monthlyCount}) exceeds 150% of average (${historicalContext.avgMonthlyCount})`);
  }

  // Rule 6: Weekend/holiday transactions
  const txDate = new Date(transaction.date);
  const dayOfWeek = txDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    riskScore += 10;
    anomalies.push('Transaction recorded on weekend - verify authorization');
  }

  // Rule 7: Missing critical fields
  if (!transaction.reference) {
    riskScore += 10;
    complianceIssues.push('Missing reference number - all transactions should have supporting documentation');
  }
  if (!transaction.congregation) {
    riskScore += 5;
    complianceIssues.push('No congregation specified - fund allocation cannot be verified');
  }

  // Rule 8: Self-approval check (same person initiates and needs to approve)
  if (transaction.initiatedBy && transaction.approvedBy && transaction.initiatedBy === transaction.approvedBy) {
    riskScore += 30;
    anomalies.push('Segregation of duties violation: same person initiated and approved');
    complianceIssues.push('COSO violation - segregation of duties not maintained');
    recommendations.push('Require different individuals for initiation and approval');
  }

  // Cap score at 100
  riskScore = Math.min(riskScore, 100);

  const riskLevel = riskScore >= 70 ? 'Critical' : riskScore >= 45 ? 'High' : riskScore >= 20 ? 'Medium' : 'Low';
  const shouldFlag = riskScore >= 40;

  return {
    riskScore,
    riskLevel,
    shouldFlag,
    flagReason: shouldFlag ? anomalies[0] || 'Multiple risk indicators detected' : null,
    anomalies,
    recommendations,
    complianceIssues,
    summary: anomalies.length > 0
      ? `${anomalies.length} risk indicator(s) detected. Risk level: ${riskLevel} (${riskScore}/100).`
      : 'No significant risk indicators detected. Transaction appears normal.'
  };
}


// ============================================
// PUBLIC API
// ============================================

/**
 * Main analysis function — tries AI first, falls back to rules
 */
async function analyzeTransaction(transaction) {
  const historicalContext = await getHistoricalContext(transaction);

  // Try Gemini AI first
  let aiResult = await analyzeTransactionWithAI(transaction, historicalContext);

  // Fall back to rule-based if AI unavailable
  if (!aiResult) {
    aiResult = await analyzeTransactionWithRules(transaction, historicalContext);
    aiResult.analysisMethod = 'rule-based';
  } else {
    aiResult.analysisMethod = 'gemini-ai';
  }

  return aiResult;
}

/**
 * Batch analyze all un-analyzed or pending transactions
 */
async function batchAnalyzeTransactions() {
  const transactions = await Transaction.find({
    status: { $in: ['Pending', 'Approved'] },
    isFlagged: false
  }).populate('donor', 'name totalDonated').populate('grant', 'title totalAmount amountRemaining');

  const results = [];
  for (const tx of transactions) {
    const analysis = await analyzeTransaction(tx);

    if (analysis.shouldFlag) {
      await Transaction.findByIdAndUpdate(tx._id, {
        isFlagged: true,
        flagReason: analysis.flagReason,
        status: 'Flagged'
      });

      await AuditLog.create({
        action: 'FLAG',
        entity: 'Transaction',
        entityId: tx._id,
        description: `AI Auto-flagged: ${tx.transactionId} - ${analysis.flagReason} (Risk: ${analysis.riskScore}/100)`,
        performedBy: `AI Analysis (${analysis.analysisMethod})`,
        role: 'system',
        severity: analysis.riskLevel === 'Critical' ? 'Critical' : 'High'
      });
    }

    results.push({
      transactionId: tx.transactionId,
      amount: tx.amount,
      type: tx.type,
      analysis
    });
  }

  return results;
}

/**
 * Calculate dynamic transparency score from actual data
 */
async function calculateTransparencyScore() {
  const totalTxns = await Transaction.countDocuments();
  const completedTxns = await Transaction.countDocuments({ status: 'Completed' });
  const reconciledTxns = await Transaction.countDocuments({ reconciled: true });
  const flaggedTxns = await Transaction.countDocuments({ isFlagged: true });
  const totalGrants = await Grant.countDocuments();
  const activeGrants = await Grant.countDocuments({ status: 'Active' });
  const closedGrants = await Grant.countDocuments({ status: 'Closed' });

  // Grants with milestones tracking
  const grantsWithMilestones = await Grant.find({ 'milestones.0': { $exists: true } });
  const totalMilestones = grantsWithMilestones.reduce((sum, g) => sum + (g.milestones?.length || 0), 0);
  const completedMilestones = grantsWithMilestones.reduce((sum, g) =>
    sum + (g.milestones?.filter(m => m.status === 'Completed').length || 0), 0);

  // Grants with compliance checklists
  const grantsWithChecklist = await Grant.find({ 'complianceChecklist.0': { $exists: true } });
  const totalChecks = grantsWithChecklist.reduce((sum, g) => sum + (g.complianceChecklist?.length || 0), 0);
  const completedChecks = grantsWithChecklist.reduce((sum, g) =>
    sum + (g.complianceChecklist?.filter(c => c.completed).length || 0), 0);

  // Calculate individual indicators
  const fundTraceability = totalTxns > 0 ? Math.round((reconciledTxns / totalTxns) * 100) : 0;
  const reportingCompliance = totalGrants > 0 ? Math.round(((activeGrants + closedGrants) / totalGrants) * 100) : 0;
  const auditReadiness = totalTxns > 0 ? Math.round(((totalTxns - flaggedTxns) / totalTxns) * 100) : 0;
  const budgetAdherence = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const complianceRate = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
  const segregationScore = totalTxns > 0
    ? Math.round((completedTxns / totalTxns) * 100)
    : 0;

  // Weighted overall transparency score
  const overallScore = Math.round(
    fundTraceability * 0.25 +
    reportingCompliance * 0.2 +
    auditReadiness * 0.2 +
    budgetAdherence * 0.15 +
    complianceRate * 0.1 +
    segregationScore * 0.1
  );

  return {
    overallScore,
    indicators: [
      { label: 'Fund Traceability', score: fundTraceability, desc: 'Percentage of transactions reconciled and traceable' },
      { label: 'Reporting Compliance', score: reportingCompliance, desc: 'Grants with active reporting and proper closure' },
      { label: 'Audit Readiness', score: auditReadiness, desc: 'Transactions without flags or compliance concerns' },
      { label: 'Budget Adherence', score: budgetAdherence, desc: 'Grant milestones completed on schedule' },
      { label: 'Compliance Rate', score: complianceRate, desc: 'Compliance checklist items completed across grants' },
      { label: 'Segregation of Duties', score: segregationScore, desc: 'Transactions properly processed through approval workflow' }
    ]
  };
}

/**
 * Calculate dynamic donor confidence score
 */
async function calculateDonorConfidence(donorId) {
  const donor = await Donor.findById(donorId);
  if (!donor) return 0;

  const grants = await Grant.find({ donor: donorId });
  const transactions = await Transaction.find({ donor: donorId, status: 'Completed' });
  const flaggedTxns = await Transaction.find({ donor: donorId, isFlagged: true });

  // Factors affecting confidence
  const totalGrants = grants.length;
  const activeGrants = grants.filter(g => g.status === 'Active').length;
  const closedGrants = grants.filter(g => g.status === 'Closed').length;
  const totalTransactions = transactions.length;
  const flaggedCount = flaggedTxns.length;

  let score = 70; // Base score

  // Positive factors
  if (closedGrants > 0) score += closedGrants * 3; // Successfully completed grants
  if (totalTransactions > 10) score += 5; // Active engagement
  if (activeGrants > 0) score += activeGrants * 2; // Ongoing relationship

  // Negative factors
  if (flaggedCount > 0) score -= flaggedCount * 5; // Flagged transactions
  if (totalGrants > 0 && grants.some(g => g.status === 'Suspended')) score -= 15;

  // Cap between 0-100
  return Math.max(0, Math.min(100, score));
}

module.exports = {
  analyzeTransaction,
  batchAnalyzeTransactions,
  calculateTransparencyScore,
  calculateDonorConfidence,
  getHistoricalContext
};
