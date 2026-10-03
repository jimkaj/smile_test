// Fixture for tests/brier.test.html: the 100 cached (f, d) pairs from the
// DataInColumns sheet of docs/BrierDecomp.xlsm (C = estimate, B = outcome),
// plus expected values. Brier/bias/slope/scatter/varD/di match the workbook.
// ci and murphyTotal are an independent Python recomputation with the CORRECT
// bin values — the workbook's CI sheet has a bin-value bug (0.2/0.4/0.6/0.8
// rows use 0.1/0.3/0.5/0.7), so its 0.036659 / 0.2133 are intentionally not used.
export const F = [0.53, 0.17, 0.53, 0.13, 0.3, 0.43, 0.55, 0.38, 0.08, 0.38, 0.01, 0.28, 0.36, 0.49, 0.09, 0.79, 0.52, 0.77, 0.08, 0.32, 0.28, 0.47, 0.37, 0.69, 0.69, 0.32, 0.12, 0.05, 0.19, 0.61, 0.69, 0.77, 0.0, 0.48, 0.51, 0.01, 0.58, 0.76, 0.09, 0.38, 0.15, 0.64, 0.23, 0.69, 0.24, 0.47, 0.22, 0.57, 0.1, 0.83, 0.9, 0.29, 0.79, 0.94, 0.21, 0.26, 0.61, 0.32, 0.67, 0.43, 0.75, 0.8, 0.29, 0.81, 0.67, 0.84, 0.96, 0.82, 0.95, 0.36, 0.64, 0.66, 0.97, 0.68, 0.21, 0.29, 0.43, 0.34, 0.92, 0.2, 0.84, 0.26, 0.44, 0.85, 0.97, 0.49, 0.56, 0.86, 0.55, 0.56, 0.83, 0.35, 0.8, 0.44, 0.62, 0.39, 0.78, 0.6, 0.81, 0.54];
export const D = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
export const EXPECTED = {
  "brier": 0.201724,
  "bias": -0.0106,
  "slope": 0.236518607,
  "scatter": 0.055943971,
  "covTotal": 0.201724,
  "varD": 0.2499,
  "di": 0.073258974,
  "ci": 0.027658974,
  "murphyTotal": 0.2043
};
