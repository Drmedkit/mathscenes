// lessonData.ts: the data sets of parts 1-4 (checked in tests/lesson-nonlinear-regression.test.ts). Pure: no DOM.
//   DRUG     one adult patient, drug concentration (mg/L) 0-8 hours after a dose. QuadReg a = .3488, b = −5.3388,
//            c = 23.2933 (R² = .9969); ExpReg a = 23.8714, b = .7509 (r² = .9997). Recorded: ŷ = 0.349x² − 5.339x + 23.293
//            and ŷ = 23.87(0.751)^x. Quadratic residuals + − − − − + + + − (a wave), exponential residuals no pattern.
//            At 12 hours: quadratic 9.5 mg/L (it turns back up after 7.6 h), exponential 0.8 mg/L.
//   BALL     one throw from a slow-motion video, height (ft) at 0-2.25 s. QuadReg a = −15.9879, b = 40.2200,
//            c = 4.7109 (R² = .9976). h = −15.99t² + 40.22t + 4.71: h(1.5) ≈ 29.1 ft; h = 0 at t ≈ −0.11 and 2.63 s.
//   SIGNUPS  weekly total sign-ups of a new app (thousands), weeks 1-8. ŷ = 0.202x² − 0.208x + 2.277 and
//            ŷ = 1.625(1.307)^x: both residuals within ±0.2; at week 9, 13, 23: 16.8 / 18.1, 33.7 / 52.8, 104 / 768.
import type { Model } from './nlMaths';

export const DRUG = { xs: [0, 1, 2, 3, 4, 5, 6, 7, 8], ys: [23.8, 18.1, 13.4, 10.2, 7.5, 5.7, 4.2, 3.3, 2.4] } as const;
export const DRUG_Q: Model = { fam: 'quad', p: [0.349, -5.339, 23.293] };
export const DRUG_E: Model = { fam: 'exp', p: [23.87, 0.751] };
export const BALL = { xs: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25], ys: [4.8, 13.1, 21.2, 26.3, 29.2, 30.0, 28.9, 25.4, 21.3, 14.6] } as const;
export const BALL_Q: Model = { fam: 'quad', p: [-15.99, 40.22, 4.71] };
export const SIGNUPS = { xs: [1, 2, 3, 4, 5, 6, 7, 8], ys: [2.1, 2.8, 3.6, 4.8, 6.2, 8.1, 10.6, 13.7] } as const;
export const SIGN_Q: Model = { fam: 'quad', p: [0.202, -0.208, 2.277] };
export const SIGN_E: Model = { fam: 'exp', p: [1.625, 1.307] };
