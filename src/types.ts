export interface PersonaProfile {
    name: string;
    relation: string;
    gender: 'male' | 'female';
    lifeStory: string;
    // Safety Booleans
    blockTravel: boolean;
    blockAliveClaims: boolean;
    redirectConfusion: boolean;
    customBoundaries: string;
    // Media
    avatarPhoto: string; // Base64
    backgroundPhotos: string[]; // Array of 4 Base64 strings
    activeBackgroundIndex: number;
}
