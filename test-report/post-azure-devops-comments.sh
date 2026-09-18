#!/usr/bin/env bash
# =============================================================================
# Azure DevOps — Post Sprint 1 E2E Test Report to work item discussions
# =============================================================================
# PREREQ: Run `az login` first (or `az devops login` with a PAT).
#   az login
# Then run this script:
#   bash test-report/post-azure-devops-comments.sh
# =============================================================================
# Work items (Sprint 1): #27, #28, #29, #31, #32, #33, #35, #36, #38
# Org: https://dev.azure.com/hsiekhai/
# =============================================================================

AZ="${AZ_CMD:-/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin/az.cmd}"
ORG="https://dev.azure.com/hsiekhai/"
WORK_ITEMS=(27 28 29 31 32 33 35 36 38)

# HTML-formatted discussion comment (per hand-off template)
read -r -d '' COMMENT <<'EOF'
<p><b>@agent:pm Test Report — Sprint 1 E2E (MoH Ambulance Mini App)</b></p>
<p><b>Verdict: ⚠️ FAIL</b> (1 bug found — fonts.css not loaded)</p>
<p><b>Test results</b></p>
<ul>
<li>Total: 35 | Passed: 34 | Failed: 1 | Pass rate: 97.1%</li>
<li>Backend API (BE-009): 25/25 PASS — all 5 Maps endpoints validate input, return 400 MISSING_KEY gracefully; /nearby ranking/filter/degradation correct</li>
<li>Frontend tokens (FE-001): 3/3 PASS — --color-brand=#C80D13, 140+ CSS vars</li>
<li>Frontend i18n (FE-002): 4/4 PASS — lang="km", Khmer title រថយន្តសង្គ្រោះ renders</li>
<li>Frontend fonts (NFR-3): 1/2 FAIL — BUG-FE-001</li>
<li>Visual diff: 1/1 PASS — baseline captured (full UI deferred to Sprint 2+)</li>
<li>Tracing: test-report/traces/TC-FE-004-fonts-not-loaded.zip</li>
<li>Screenshot: test-report/screenshots/TC-FE-004-fonts-not-loaded.png</li>
</ul>
<p><b>Failed case</b></p>
<p><b>BUG-FE-001 (High):</b> <code>frontend/src/styles/fonts.css</code> is never imported in <code>main.tsx</code>, so @font-face declarations for Kantumruy Pro / Inter / Roboto are NOT loaded. Khmer text renders with system fallback font instead of Kantumruy Pro. Violates NFR-3.</p>
<p>Root cause: <code>main.tsx</code> imports <code>./styles/tokens.css</code> but omits <code>./styles/fonts.css</code>. Fix: add <code>import './styles/fonts.css';</code> before the tokens import.</p>
<p><b>Environment</b></p>
<p>Playwright v1.63.0, Chromium, Windows, Backend port 3000 (no API key), Frontend Vite port 5173. Full report: <code>test-report/test-report.md</code></p>
EOF

for id in "${WORK_ITEMS[@]}"; do
  echo "Posting to work item #$id..."
  "$AZ" boards work-item update --id "$id" --discussion "$COMMENT" --org "$ORG" 2>&1 | head -3
done

echo "=== Done. Posted to ${#WORK_ITEMS[@]} work items. ==="