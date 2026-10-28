// lessonData.ts: the data sets of parts 1-4 (checked in tests/lesson-linear-regression.test.ts). Pure: no DOM.
//   CARS   8 used cars of one model: mileage (thousand miles) and asking price ($ thousands). Least squares:
//          a = 23.87, b = -0.1188, r = -0.959 -> line C, y-hat = 23.9 - 0.12x (sum of squared residuals 8.56); line A
//          joins the first and last car (19.83, every other car above it); line B goes through cars 2-4 (62.0).
//   STUDY  10 students: hours studied and test score. LinReg(a+bx): a = 53.1792, b = 4.6918, r = .9407, r2 = .8849.
//   STOP   one car on dry pavement: speed (mph) and total stopping distance (feet). r = 0.9905; the residuals of
//          y-hat = -91.0 + 5.52x are + + + - - - - - - + + (a U).
export const CARS = { xs: [20, 30, 45, 55, 70, 80, 95, 110], ys: [20, 22, 19, 17, 15, 14, 14, 10] } as const;
export const CAR_LINES = {
  A: { a: 20 + 20 / 9, b: -1 / 9 },
  B: { a: 28, b: -0.2 },
  C: { a: 23.9, b: -0.12 },
} as const;
export const STUDY = { xs: [1, 2, 3, 3, 4, 5, 6, 7, 8, 9], ys: [55, 68, 66, 67, 70, 76, 84, 90, 81, 100] } as const;
export const STOP = { xs: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70], ys: [42, 52, 75, 92, 118, 142, 175, 205, 240, 275, 315], a: -91, b: 5.52 } as const;
