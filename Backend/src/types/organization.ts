export interface OrganizationData {
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    admin: string;
    capacity?: number;
    status?: "active" | "inactive";
    industry?: string;
    website_url?: string;
    contact_email?: string;
    phone_number?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
}
