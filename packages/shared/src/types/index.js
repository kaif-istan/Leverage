"use strict";
// ─── Enums ────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_USER_PREFERENCES = exports.DEFAULT_OPPORTUNITY_WEIGHTS = void 0;
exports.DEFAULT_OPPORTUNITY_WEIGHTS = {
    matchWeight: 0.30,
    salaryWeight: 0.25,
    companyQualityWeight: 0.20,
    hiringVelocityWeight: 0.10,
    remoteWeight: 0.08,
    freshnessWeight: 0.07,
};
exports.DEFAULT_USER_PREFERENCES = {
    salaryCurrency: 'USD',
    remotePreference: 'any',
    digestTime: '07:00',
    digestEnabled: true,
    minOpportunityScoreAlert: 85,
};
//# sourceMappingURL=index.js.map