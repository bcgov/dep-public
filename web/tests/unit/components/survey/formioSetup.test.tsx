const useMock = jest.fn();

jest.mock('@formio/react', () => ({
    Formio: {
        use: useMock,
        Utils: {
            Evaluator: {
                noeval: true,
            },
        },
    },
}));

jest.mock('met-formio', () => ({
    __esModule: true,
    default: { name: 'met-formio-components' },
}));

jest.mock('@bcgov/formio', () => ({
    __esModule: true,
    default: { name: 'bcgov-formio-components' },
}));

jest.mock('components/Form/formio.scss', () => ({}));

describe('setupFormio', () => {
    beforeEach(() => {
        jest.resetModules();
        useMock.mockReset();
    });

    it('registers met-formio and common-hosted-form-service components once', async () => {
        const setupFormio = (await import('components/Form/formio/setup')).default;
        const metFormio = (await import('met-formio')).default;
        const bcgovFormio = (await import('@bcgov/formio')).default;
        const { Formio } = await import('@formio/react');

        setupFormio();

        expect(useMock).toHaveBeenCalledTimes(2);
        expect(useMock).toHaveBeenNthCalledWith(1, metFormio);
        expect(useMock).toHaveBeenNthCalledWith(2, bcgovFormio);
        expect(Formio.Utils.Evaluator.noeval).toBe(false);
    });

    it('does not re-register components after initialization', async () => {
        const setupFormio = (await import('components/Form/formio/setup')).default;

        setupFormio();
        setupFormio();

        expect(useMock).toHaveBeenCalledTimes(2);
    });
});
