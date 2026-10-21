# Calculate simple interest (primary.ratios.calculate-simple-interest, grade 7, 7.RP.A.3)

**Concept.** Simple interest is a percent OF THE PRINCIPAL, taken once per year: every year adds the same amount, so
I = P × r × t (t in years, so months / 12). The principal is the 100% base; the ending balance (or amount owed) is
P + I. Compound interest takes the percent of the LATEST balance instead: equal after year 1, then a growing gap.

**Model: interest tapes** (`InterestTape.ts`, maths in `interestMaths.ts`: integer cents, rates in hundredths of a
percent, exact units of 1/120000 cent so rounding and whole-cent checks are exact). One row per year, like the
year-by-year table drawn: row 0 "start" = the principal as an amber tape braced "$2,000 = 100%" (ten dashed 10%
cells on demand); row k = the same tape plus k teal stubs, one per year. Simple: equal stubs that line up in columns
down the stack; compound: each stub a little wider. A lavender ring marks the BASE of a year (the principal part, or
the whole row for compound); the label under a row's newest stub says what that year added ("+ $100"); a brace under
the last row gives the total interest. Span mode: one "end" row with t stubs and a partial stub (dashed full-year
ghost) for fractional years. Focus `compound` morphs the stubs toward the compound rule and `gap` shows the compound
excess as red dashed ghosts (Alex's proof). Steps: `tape whole cells rows y1..y10 gain`. Layout is pure and checked
(fits the frame, every practice picture tested).

**Board.** P = $2,000 = 100%, the one-year line (0.05 × $2,000 = $100), a year | interest | balance table written row
by row as the tapes grow, then I = P × r × t three lines. Leaders: $2,000 → the principal tape, $100 → the year-1
stub. Colours: principal amber, interest / rate teal, balance lime, base ring lavender, wrong red.

## The five parts
1. **The question**: Maya, $2,000 at 5% simple, 3 years. Cards $2,100 (omits-time), $2,300, $2,315.25
   (compounds-simple-interest) + how sure. Four empty rows (no stubs yet) and the givens on the board.
2. **Worked example**: Name the principal (100%, 10% cells, leader) → One year (ring on the principal, the stub grows:
   half a cell = $100; table rows 0-1) → Year by year (the ring stays on the principal, equal stubs; rows 2-3) → The
   formula (brace $300; I = P × r × t; $2,300 ringed). Why: "always 5% of the original $2,000" / "5% of the new
   balance" (compounds) / "5% means $5" (percent-as-fixed-amount).
3. **Your turn**: Sam's loan, $1,500 at 4%, 3 years, faded from the end: principal and one year are done; the kid
   types the total interest ($180; $60 = omits-time, $187.30 = compounds) and the amount owed ($1,680; $180 =
   change-reported-as-final, $1,560 = omits-time, $1,320 = borrower-receives-interest). Callback to the card.
4. **Prove it**: Alex's "simple" interest on $1,000 at 10% for 3 years done on the new balance ($1,331). Judge, then
   a because-chain: year 1 is right (both rules start on the principal) / year 2 adds $100 (the ring stays on the
   principal; the stubs straighten, red gap ghosts, Alex's cells struck) / $1,300, Alex's is compound (gap $0, $10,
   $31). Distractors: differ-after-one-year, gap-stays-small, compounds-simple-interest.
5. **Practice**: every sub-goal in topic order, then mixed. Tape pictures for most items (hidden labels "?"), a board
   table for the multi-year families, a bare slate for the conversion / comparison items; the worked solution replays
   on a miss (post steps, base rings, solved table cells, work lines).

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| identify-principal | whoIsP (choice of three amounts), findP (read it off a statement with an account number) |
| rate-as-percent-of-principal | per100 ($r per $100), rateVsDollars |
| match-rate-period | periodTrap ("12 × the rate"), oneYearUnit |
| savings-and-loan-contexts | loanRoles (who pays / the principal, one irrelevant number), earnOrOwe (saver vs borrower) |
| interest-friendly | oneYear (tape + cells), fromTen (from 10%) |
| interest-decimal-rates | decInterest (curated exact-cent pairs + generated), pctToDec |
| new-balance | endBalance (savings / owed), labelBoth (interest and balance, two boxes) |
| balance-multiplier | multExpr (800 × 0.06 / 1.6 / 1.06 / + 6), multValue |
| round-to-cent | roundI (halves up), roundRule (round once, same amount in the balance; rate kept exact) |
| justify-reasonableness | spotError (planted slip or none), estimate (1% and 10% bounds) |
| simple-multi-year | tableCell (year-by-year table), sameEach |
| simple-interest-formula | formulaI, formulaTotal, costOfCredit (higher rate is not always costlier) |
| fractional-years | monthsT (t = months / 12), monthsI |
| compound-year-by-year | compoundCell, compoundBase |
| compare-simple-compound | ruleFromTable (incl. year-1 only: can't tell), gapGrows, saverBorrower |

No runtime change was needed. The page uses a wider board (x 1020-1860) like sales-tax and draws its own leaders.
