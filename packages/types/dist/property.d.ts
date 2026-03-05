import type { MustHaveAmenity, ComplaintCategory, ResortType } from './preferences.js';
export type PlatformSource = 'google-places' | 'expedia' | 'booking.com' | 'tripadvisor' | 'agoda' | 'airbnb';
export interface PlatformRef {
    platform: PlatformSource;
    propertyId: string;
    /** Deep link straight to the booking page */
    bookingUrl: string;
    /** Price per night in USD from this platform (null if unavailable) */
    pricePerNight: number | null;
    /** Rating on 0–10 scale (convert 5-star to ×2) */
    rating: number | null;
    reviewCount: number | null;
}
export interface PropertyCoordinates {
    lat: number;
    lng: number;
}
/** Extracted from review NLP / meta data */
export interface ComplaintSummary {
    category: ComplaintCategory;
    /** How many reviews mention this issue (absolute count) */
    mentionCount: number;
    /** Percentage of reviews that mention this issue */
    mentionRate: number;
}
/** Single normalised property as returned by any adapter */
export interface RawPropertyData {
    /** Canonical name (use Google Places as primary) */
    name: string;
    coordinates: PropertyCoordinates;
    /** Address components */
    address: string;
    country: string;
    city: string;
    /** Resolved types that we matched for this property */
    resolvedTypes: ResortType[];
    /** Amenities confirmed for this property */
    confirmedAmenities: MustHaveAmenity[];
    /** Dominant photo URL */
    photoUrl?: string;
    /** Cross-platform platform references */
    platforms: PlatformRef[];
    /** Distance in km from requested beach / landmark */
    distanceFromBeach?: number;
    distanceFromCenter?: number;
    /** Aggregated (mean across platforms) */
    aggregatedRating: number | null;
    aggregatedReviewCount: number | null;
    aggregatedPricePerNight: number | null;
    /** NLP-extracted complaint themes */
    complaintSummaries: ComplaintSummary[];
    /** ISO timestamp when this data was fetched */
    fetchedAt: string;
}
//# sourceMappingURL=property.d.ts.map