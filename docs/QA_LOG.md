# Lab 11 QA Log

## Step 4 — QA before the final hardening pass

The calculator did not exist before Lab 11. At the step 4 checkpoint, the step 3 JavaScript already validated the allowed coffee, weight, and delivery values, rejected invalid quantities, performed cent-based arithmetic, and wrote results through `textContent`. The later browser pass exercised all ten cases; results and the distinction between automated browser checks and remaining assistive-technology checks are recorded below.

| What was entered / changed | Initial behavior | How corrected |
|---|---|---|
| Quantity `2` | Initially there was no calculator or estimate. At this checkpoint, the calculation uses an integer quantity and cents. | Added the calculator and validated quantity parsing before calculation. |
| Empty quantity | Initially there was no calculator or estimate. At this checkpoint, the result is cleared and a quantity message is available after interaction. | Added required quantity validation and a per-field error message. |
| Quantity `0` | Initially there was no calculator or estimate. At this checkpoint, values below 1 are rejected. | Enforced the approved 1–20 range in the calculation logic and set HTML `min`/`max`. |
| Quantity `-5` | Initially there was no calculator or estimate. At this checkpoint, negative integer values are rejected with a range message. | Added numeric normalization and lower-bound validation. |
| Quantity `9999999999999999` or `1e309` | Initially there was no calculator or estimate. At this checkpoint, out-of-range or non-integer input is rejected before money is calculated. | Added string validation, `Number.isFinite`, `Number.isInteger`, range checks, and safe-cent checks. |
| Quantity `2.5` | Initially there was no calculator or estimate. At this checkpoint, fractional quantities are rejected rather than rounded. | Require a whole-number quantity and show a human-readable message. |
| Change coffee, weight, or delivery to a value outside the supported options | Initially there was no calculator or estimate. At this checkpoint, only whitelist values are accepted. | Validate each select value against the corresponding allowlist before calculating. |
| Toggle first-order checkbox | Initially there was no calculator or estimate. At this checkpoint, a checked box applies a rounded 10% discount to coffee plus delivery. | Apply `Math.round` to the pre-discount total in cents. |
| Change inputs rapidly in succession | Initially there was no calculator or estimate. By code, updates are synchronous and each event recalculates from the current input strings; visual stability still needs browser verification. | Keep calculation synchronous and scoped to each widget instance. |
| Remove a required field or output node from a widget | Initially there was no calculator or estimate. By code, initialization warns and returns before binding handlers when required nodes are missing; browser console behavior needs manual verification. | Check required nodes before initialization and issue one `console.warn` for the incomplete widget. |

## Ten-case test plan

| # | Case | Classification |
|---|---|---|
| 1 | Valid whole-number quantity (`2`) | Browser PASS: Ethiopian Bloom 250g × 2 gives $44.00 coffee and $48.00 total with Standard delivery. |
| 2 | Empty quantity | Browser PASS: field invalid, error displayed, all result values show `—`. |
| 3 | Zero quantity | Browser PASS: rejected with “Enter a quantity from 1 to 20.” |
| 4 | Negative quantity (`-5`) | Browser PASS: rejected with “Enter a quantity from 1 to 20.” |
| 5 | Very large quantity (`9999999999999999`) and overflow text (`1e309`) | Browser PASS: both rejected; no amount is rendered. |
| 6 | Fractional quantity (`2.5`) | Browser PASS: rejected with “Enter a whole number of bags.” |
| 7 | Change a select to a value not in its allowlist | Browser PASS: tampered coffee value rejected and results cleared. |
| 8 | Toggle first-order checkbox | Browser PASS: $2.60 discount on $22.00 coffee + $4.00 delivery; total $23.40. |
| 9 | Rapidly change quantity, selects, and checkbox | Browser PASS: final Golden Hour 500g × 2, Pickup, first order total is $57.60. |
| 10 | Remove required fields and reload | Browser PASS: incomplete widget emits the expected warning and causes no uncaught runtime exception. |

The separately calculated examples also passed in the browser: Golden Hour 500g × 2 with Pickup and first order totals $57.60; Sumatra Night 250g × 1 with Standard and first order totals $25.20. The self-test reported PASS on all 13 rows: valid input, seven quantity edge values, a tampered select, the first-order calculation, rapid changes, missing DOM, and two independent instances with unique IDs.

## Step 5 — additional hardening and accessible field states

The calculator's select fields now have native `required` constraints; its number field has `type="number"`, `min="1"`, `max="20"`, `step="1"`, `required`, and `inputmode="numeric"`. The JavaScript validates raw string values, uses allowlists, checks finite/integer/safe-cent values, rejects fractions (does not round quantity), updates error text with `textContent`, and leaves results as em dashes when invalid. Field errors are hidden until interaction, then linked with `aria-describedby` and reflected through `aria-invalid` and border-state classes.

The following approved legacy protections were applied in `js/script.js`. Builder pricing and builder add-button behavior (#1–#2) were intentionally left unchanged.

| Approved finding | Change made |
|---|---|
| #3 Cart quantity accepts fractional and unsafe values | Added `step="1"`, `required`, and `inputmode="numeric"` to cart quantity controls; reject non-safe whole values on change and restore the previous valid quantity. No maximum was added because only the calculator's max of 20 was approved. |
| #4 Checkout totals can receive invalid stored numbers | Validate cart shape, price, quantity, line totals, subtotal, and delivery before formatting; malformed entries cannot propagate `NaN` or `Infinity` into totals. |
| #5 Weather configuration can reject outside the catch | Move configuration validation inside the existing `try/catch` and guard the status update when the status element is absent. |
| #6 Missing cart empty state or product metadata can throw | Guard `emptyState` on both branches and normalize missing `data-meta` to a safe string before splitting. |

## Step 6 — isolation and regression

| Surface | Browser result |
|---|---|
| IDs, global variables, selectors | New calculator IDs remain `est-*`; widget code is wrapped in an IIFE, does not use forbidden global form names/classes/data selectors, and scopes field/output queries to each root. |
| Two widget instances | PASS: separate totals ($48.00 and $57.60) and unique IDs. |
| Header and mobile menu | PASS at 375px: menu toggles `aria-expanded` true/false and `.main-nav` open state. |
| Cart product action after calculator changes | PASS: Ethiopian Bloom still adds at $22 with its original metadata after changing calculator coffee/weight/delivery/quantity. |
| Missing cart empty state and missing `data-meta` | PASS: rendering without the empty-state element does not throw; clicking a product button without metadata still adds a $22 item without a runtime error. |
| Swiper, Fancybox, Typed.js | Libraries are present; slider navigation changes slide state, gallery opens and closes with Escape, and Typed.js cursor/text are present. |
| Weather and newsletter | Weather status rendered current Lviv conditions; newsletter submit displayed its existing “not connected” status. |
| Responsive widths | PASS with no document horizontal overflow at 320, 375, 768, 1024, 1280, and 1440 px. |
| Corrupted cart storage | PASS: an invalid saved price renders “Unavailable”, shows a user-facing warning, disables checkout, and does not display `NaN` or `Infinity`; a valid cart still totals $44.00 + $4.00 = $48.00. |

No uncaught JavaScript errors were observed in the browser. Existing environment/CDN warnings (Tailwind Play CDN production notice and an unsupported `web-share` feature) remain; the intentional missing-DOM self-test also emits the required `console.warn`. Automated browser checks do not replace a manual screen-reader/keyboard audit.

## Step 7 — self-audit

| Problem | Criticality | Cause | Recommendation |
|---|---|---|---|
| Architecture — non-Golden-Hour 500g/1kg prices are derived from the approved Golden Hour rate | LOW | The existing product page defines weight prices only for Golden Hour; other weight prices remain a business proposal. | Confirm the proposal against the final product price list before treating it as production pricing. |
| UX — the estimate does not persist a promotion into checkout | LOW | This widget is an estimator and the existing checkout has no first-order discount integration. | Keep “Estimated total” clear; implement checkout promotion separately only if requested. |
| JavaScript — no critical or medium calculator issues found in the tested flows | PASS | Input validation, allowlists, cents arithmetic, missing-DOM handling, and cart total guards were exercised. | Re-run the documented self-test after future changes. |
| Security — no user-provided string is inserted as HTML | PASS | Calculator results and errors use `textContent`; allowed select values are checked against fixed maps. | Keep all future calculator output on the `textContent` path. |
| Accessibility — live-region announcement timing is not yet verified with a screen reader | LOW | Browser DOM/ARIA states were inspected, but no screen-reader session was available. | Manually verify live-region announcements and keyboard focus with a screen reader. |
| Responsive — no horizontal overflow at tested viewport widths | PASS | Browser measured document width at 320/375/768/1024/1280/1440 px. | No change required. |

## Step 8 — console self-test

`docs/widget-selftest.js` is not included in the site HTML. It reports PASS/FAIL rows for the input edge cases, a modified select, the first-order discount, rapid changes, missing DOM, and two instances. The browser run produced 13 PASS rows; the intentional incomplete-DOM case emits one warning by design.

## Lab 12 — order calculator accessibility and mobile QA

Tested the existing calculator on the local site at a 390 px viewport. The existing `docs/widget-selftest.js` returned 13/13 PASS cases. The widget logic and `js/validation.js` were not changed; the first-order checkbox label was enlarged to a 48 px minimum hit area without increasing the row height.

| Test Case | Expected Result | Actual Risk | Recommendation |
|---|---|---|---|
| Tab and Shift+Tab through calculator fields | Focus follows DOM order and can move backward without trapping | No keyboard trap observed; tested select-to-select traversal | Retain native controls and repeat with a screen reader before release |
| Visible keyboard focus | Focused field displays the accent focus indicator | `:focus-visible` matched and the Tailwind ring resolved to the accessible accent token | Visually confirm in the target browser and retain the focus utility classes |
| Labels and error descriptions | Every field has a label and an error target referenced by `aria-describedby` | All five calculator fields resolved to their matching error element; error messages use polite live regions | Keep error IDs unique if more widget instances are added |
| Invalid quantity | Invalid value sets `aria-invalid`, announces a specific error, and clears calculated totals | `0` produced “Enter a quantity from 1 to 20.” and cleared the total | Keep field-level validation and avoid displaying stale totals |
| Valid quantity and totals | Valid value updates the estimate immediately | Quantity `2` produced a `$48.00` total; initial state was `$26.00` | Recheck currency and shipping assumptions if business rules change |
| Input edge cases and instance isolation | Reject invalid/tampered values and keep multiple instances independent | Existing browser self-test passed all 13 cases, including tampered coffee, extreme quantities, XSS-shaped text, missing DOM, and two instances | Continue running `docs/widget-selftest.js` after widget changes |
| Mobile touch and layout | Controls remain usable at 390 px with no horizontal overflow | Selects and quantity input measured at least 48 px high; checkbox label measured 193×48 px; document did not overflow the viewport | Manually verify on a physical touch device |
| Assistive-technology announcement | Names, errors, and changing totals are announced coherently | DOM label/ARIA wiring was verified; a screen reader was not available in this run | Perform a manual NVDA or VoiceOver pass before release |
