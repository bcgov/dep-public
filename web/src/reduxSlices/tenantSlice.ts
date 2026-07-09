import { createSlice } from '@reduxjs/toolkit';

export interface TenantState {
    id: string;
    name: string;
    heroImageUrl: string;
    basename: string;
    loading: boolean;
    isLoaded: boolean;
    title: string;
    contact_email: string;
    contact_name: string;
    description: string;
    short_name: string;
    hero_image_description: string;
    hero_image_credit: string;
}
export const initialTenantState: TenantState = {
    id: '',
    name: '',
    heroImageUrl: '',
    basename: '',
    loading: true,
    isLoaded: false,
    title: '',
    contact_email: '',
    contact_name: '',
    description: '',
    short_name: '',
    hero_image_description: '',
    hero_image_credit: '',
};

export const userSlice = createSlice({
    name: 'tenant',
    initialState: initialTenantState,
    reducers: {
        loadingTenant: (state, action) => {
            state.loading = action.payload;
        },
        saveTenant: (state, action) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.heroImageUrl = action.payload.heroImageUrl || '';
            state.basename = action.payload.basename;
            state.isLoaded = true;
            state.title = action.payload.title;
            state.contact_email = action.payload.contact_email;
            state.contact_name = action.payload.contact_name;
            state.description = action.payload.description;
            state.short_name = action.payload.short_name;
            state.hero_image_description = action.payload.hero_image_description;
            state.hero_image_credit = action.payload.hero_image_credit;
        },
    },
});

// Action creators are generated for each case reducer function
export const { saveTenant, loadingTenant } = userSlice.actions;

export default userSlice.reducer;
