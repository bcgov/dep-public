import { landingLoader } from 'components/landing/landingLoader';
import { getEngagementSearchCounts, getPublicEngagementSearch } from 'services/engagementService';
import { getMetadataFilters, getMetadataTaxa } from 'services/engagementMetadataService';

jest.mock('services/engagementService');
jest.mock('services/engagementMetadataService');

const mockTaxa = jest.mocked(getMetadataTaxa);
const mockFilters = jest.mocked(getMetadataFilters);
const mockCounts = jest.mocked(getEngagementSearchCounts);
const mockSearch = jest.mocked(getPublicEngagementSearch);

beforeEach(() => {
    mockTaxa.mockResolvedValue([{ id: 12, tenant_id: 1, position: 0, name: ' Region ', is_required: true }]);
    mockFilters.mockResolvedValue([
        { taxon_id: 12, name: 'Region', filter_type: 'chips_any', values: ['North', 'South', 'West'] },
    ]);
    mockSearch.mockResolvedValue({ items: [], total: 0 });
});

it('returns open counts for regions with engagements, including regions with only closed engagements', async () => {
    mockCounts.mockResolvedValue({
        status_counts: {},
        metadata_counts: { '12:North': 3, '12:South': 0, '12:West': 0 },
        metadata_total_counts: { '12:North': 5, '12:South': 2, '12:West': 0 },
    });

    const data = landingLoader();

    await expect(data.regions).resolves.toEqual([
        { name: 'North', count: 3, searchParam: 'meta-region' },
        { name: 'South', count: 0, searchParam: 'meta-region' },
    ]);
    await expect(data.regionFilter).resolves.toMatchObject({ values: ['North', 'South', 'West'] });
    expect(mockCounts).toHaveBeenCalledWith({
        published_from_date: '1970-01-01',
        engagement_status: ['open'],
        metadata: [],
    });
});

it('uses the disambiguated metadata parameter when region filter names collide', async () => {
    mockFilters.mockResolvedValue([
        { taxon_id: 12, name: 'Region', filter_type: 'chips_any', values: ['North'] },
        { taxon_id: 13, name: 'Region', filter_type: 'chips_any', values: ['Other'] },
    ]);
    mockCounts.mockResolvedValue({
        status_counts: {},
        metadata_counts: { '12:North': 1 },
        metadata_total_counts: { '12:North': 1 },
    });

    await expect(landingLoader().regions).resolves.toEqual([
        { name: 'North', count: 1, searchParam: 'meta-region-12' },
    ]);
});

it('does not request counts when there is no required region filter', async () => {
    mockTaxa.mockResolvedValue([]);

    const data = landingLoader();

    await expect(data.regionFilter).resolves.toBeNull();
    await expect(data.regions).resolves.toEqual([]);
    expect(mockCounts).not.toHaveBeenCalled();
});

it('propagates count request failures', async () => {
    mockCounts.mockRejectedValue(new Error('Counts unavailable'));

    await expect(landingLoader().regions).rejects.toThrow('Counts unavailable');
});

it('rejects incomplete count responses instead of displaying incorrect counts', async () => {
    mockCounts.mockResolvedValue({
        status_counts: {},
        metadata_counts: {},
        metadata_total_counts: { '12:North': 1 },
    });

    await expect(landingLoader().regions).rejects.toThrow('Missing engagement counts for region: North');
});
