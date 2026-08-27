import { validateAndSanitizeUrl, isPrivateOrReservedIp } from '../services/ssrfGuard';
import { calculateRiskScore, RawAnalysisSignals } from '../services/riskEngine';
import { MockSandboxPaymentProvider } from '../services/paymentProvider';

/**
 * SafeCart Automated Unit & Security Test Suite
 */
export async function runAllTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => results.push({ name, passed: true }))
          .catch((err) => results.push({ name, passed: false, error: err.message }));
      }
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // 1. SSRF Guard Tests
  test('SSRF Guard: Blocks localhost and 127.0.0.1', async () => {
    const res1 = await validateAndSanitizeUrl('http://localhost:3000/admin');
    if (res1.isValid) throw new Error('Localhost should be blocked');

    const res2 = await validateAndSanitizeUrl('http://127.0.0.1/test');
    if (res2.isValid) throw new Error('127.0.0.1 should be blocked');
  });

  test('SSRF Guard: Blocks AWS/GCP Cloud Metadata 169.254.169.254', async () => {
    const res = await validateAndSanitizeUrl('http://169.254.169.254/latest/meta-data');
    if (res.isValid) throw new Error('Cloud metadata endpoint should be blocked');
  });

  test('SSRF Guard: Blocks dangerous protocols javascript: and data:', async () => {
    const res1 = await validateAndSanitizeUrl('javascript:alert(1)');
    if (res1.isValid) throw new Error('javascript: protocol should be blocked');

    const res2 = await validateAndSanitizeUrl('data:text/html,<h1>Hacked</h1>');
    if (res2.isValid) throw new Error('data: protocol should be blocked');
  });

  test('SSRF Guard: Normalizes valid shopping domains', async () => {
    const res = await validateAndSanitizeUrl('nike.com');
    if (!res.isValid || res.domain !== 'nike.com' || !res.normalizedUrl?.startsWith('https://')) {
      throw new Error('Valid domain failed normalization');
    }
  });

  // 2. Risk Engine Tests
  test('Risk Engine: Clean verified website scores LOW risk', () => {
    const raw: RawAnalysisSignals = {
      domain: 'amazon.com',
      url: 'https://amazon.com',
      hasHttps: true,
      hasValidSsl: true,
      tld: '.com',
      domainLength: 10,
      hyphenCount: 0,
      numberCount: 0,
      isTypoSquatted: false,
      domainAgeMonths: 240,
      hasPrivacyPolicy: true,
      hasRefundPolicy: true,
      hasTermsOfService: true,
      hasPhysicalAddress: true,
      hasPhoneOrEmailContact: true,
      hasSuspiciousPaymentInstructions: false,
      hasExcessiveUrgency: false,
      hasBrokenSocialLinks: false,
      redirectCount: 0,
      communityReportsCount: 0,
      confirmedReportsCount: 0,
      pendingReportsCount: 0
    };

    const evaluation = calculateRiskScore(raw);
    if (evaluation.level !== 'LOW' || evaluation.score > 29) {
      throw new Error(`Expected LOW risk, got ${evaluation.level} (Score: ${evaluation.score})`);
    }
  });

  test('Risk Engine: High-risk brand typosquatting & missing refund scores HIGH/VERY HIGH', () => {
    const raw: RawAnalysisSignals = {
      domain: 'official-brand-outlet-deals.xyz',
      url: 'https://official-brand-outlet-deals.xyz',
      hasHttps: false,
      hasValidSsl: false,
      tld: '.xyz',
      domainLength: 32,
      hyphenCount: 4,
      numberCount: 2,
      isTypoSquatted: true,
      impersonatedBrand: 'Nike',
      domainAgeMonths: 1,
      hasPrivacyPolicy: false,
      hasRefundPolicy: false,
      hasTermsOfService: false,
      hasPhysicalAddress: false,
      hasPhoneOrEmailContact: false,
      hasSuspiciousPaymentInstructions: true,
      hasExcessiveUrgency: true,
      hasBrokenSocialLinks: true,
      redirectCount: 2,
      communityReportsCount: 6,
      confirmedReportsCount: 4,
      pendingReportsCount: 2
    };

    const evaluation = calculateRiskScore(raw);
    if (evaluation.score < 75 || (evaluation.level !== 'HIGH' && evaluation.level !== 'VERY HIGH')) {
      throw new Error(`Expected HIGH/VERY HIGH risk, got ${evaluation.level} (Score: ${evaluation.score})`);
    }
  });

  // 3. Payment Protection Sandbox Tests
  test('Payment Provider: Generates protected sandbox transaction and handles refund workflow', async () => {
    const provider = new MockSandboxPaymentProvider();
    const payResult = await provider.createPayment({
      userId: 'test_user',
      userName: 'Test User',
      userEmail: 'test@example.com',
      websiteId: 'web_test',
      domain: 'test-store.com',
      productName: 'Sample Product',
      amount: 50.0
    });

    if (!payResult.success || payResult.transaction.status !== 'PROTECTED') {
      throw new Error('Protected sandbox transaction creation failed');
    }

    const refResult = await provider.requestRefund(payResult.transaction.id, 'Non delivery');
    if (refResult.transaction.status !== 'REFUND_REQUESTED') {
      throw new Error('Refund request state transition failed');
    }

    const procResult = await provider.processRefund(payResult.transaction.id, true);
    if (procResult.transaction.status !== 'REFUNDED') {
      throw new Error('Refund processing failed');
    }
  });

  console.log('[SafeCart Tests Complete]:', results);
  return results;
}
