import { useSearchParams } from 'react-router-dom';

export function useEnvironmentFilter() {
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedEnvironmentId = searchParams.get('environment_id')
        ? parseInt(searchParams.get('environment_id')!)
        : null;

    const setEnvironmentId = (envId: number | null) => {
        const newParams = new URLSearchParams(searchParams);
        if (envId === null) {
            newParams.delete('environment_id');
        } else {
            newParams.set('environment_id', envId.toString());
        }
        setSearchParams(newParams);
    };

    return { selectedEnvironmentId, setEnvironmentId };
}
