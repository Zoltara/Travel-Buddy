export function applyHardFilters(properties, prefs) {
    const passed = [];
    const eliminated = [];
    for (const prop of properties) {
        const reasons = [];
        // ── Rating filter ──────────────────────────────────────────────────────
        if (prop.aggregatedRating !== null &&
            prop.aggregatedRating < prefs.minRating) {
            reasons.push(`Rating ${prop.aggregatedRating.toFixed(1)} below minimum ${prefs.minRating}`);
        }
        // ── Review count filter ────────────────────────────────────────────────
        if (prop.aggregatedReviewCount !== null &&
            prop.aggregatedReviewCount < prefs.minReviewCount) {
            reasons.push(`Only ${prop.aggregatedReviewCount} reviews, minimum is ${prefs.minReviewCount}`);
        }
        // ── Price filter ───────────────────────────────────────────────────────
        if (prop.aggregatedPricePerNight !== null) {
            if (prop.aggregatedPricePerNight < prefs.budgetPerNightMin) {
                reasons.push(`Price $${prop.aggregatedPricePerNight}/night below minimum budget $${prefs.budgetPerNightMin}`);
            }
            if (!prefs.flexibleBudget &&
                prop.aggregatedPricePerNight > prefs.budgetPerNightMax) {
                reasons.push(`Price $${prop.aggregatedPricePerNight}/night exceeds budget $${prefs.budgetPerNightMax}`);
            }
        }
        // ── Complaint category filter ──────────────────────────────────────────
        for (const summary of prop.complaintSummaries) {
            if (prefs.avoidComplaintCategories.includes(summary.category) &&
                summary.mentionRate > 0.15 // >15% mentions = dealbreaker
            ) {
                reasons.push(`High ${summary.category} complaints (${Math.round(summary.mentionRate * 100)}% of reviews)`);
            }
        }
        // ── Must-have amenities (hard block only if user toggled "beachfront") ─
        // Soft amenities handled via amenitiesScore; only "beachfront" is a hard filter
        if (prefs.mustHaveAmenities.includes('beachfront') &&
            !prop.confirmedAmenities.includes('beachfront')) {
            reasons.push('Property is not beachfront');
        }
        if (reasons.length > 0) {
            eliminated.push({ property: prop, reason: reasons.join('; ') });
        }
        else {
            passed.push(prop);
        }
    }
    return { passed, eliminated };
}
//# sourceMappingURL=filter.js.map