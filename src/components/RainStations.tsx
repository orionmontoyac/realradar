import { useEffect, useState } from 'react';
import RainStationsCard from './RainStationsCard'; // Assuming RainStationsCard component exists and is correctly imported

interface StationAttribute {
    id_atributo: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    valor_numerico: number | null;
    valor_alfanumerico: string;
    valor_fecha: string | null;
    variable: string | null;
    resolucion: string | null;
    titulo: string;
}

interface Station {
    id_feature_vector: string;
    geometry_text: string; // Assuming this might be used for map coordinates, e.g., "POINT(-75.57 6.25)"
    atributos: {
        descripcion: {
            [key: string]: StationAttribute; // e.g., D_5_m, D_30_D
        };
        grafico: {
            [key: string]: StationAttribute;
        };
        metadato: {
            [key: string]: StationAttribute;
        };
    };
}

interface ApiResponse {
    feature_vector: Station[];
}

const API_URL = "https://siata.gov.co/siata_nuevo/index.php/capa_service/consultar_capa_carga";
const LAYER_ID = "C_00000000000000000000211";
const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export default function RainStations() {
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStations = async () => {
        // console.log('Fetching stations...'); // Kept for debugging, can be removed
        setLoading(true); // Set loading to true at the beginning of a fetch attempt
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    // ' Access-Control-Allow-Origin': '*',
                    // It's crucial to handle the Cookie header carefully.
                    // This cookie is specific to a user session. Directly using a captured cookie
                    // in a different context might not work or could have security implications.
                    // Consider if you actually need to send this specific cookie.
                    //'Cookie': '_ga=GA1.3.1757361720.1686965234; ci_session=...[trimmed for brevity]...7a5c368a82a8f6cae8da8b59e18a979b; ci_session=a%3A5%3A%7Bs%3A10%3A%22session_id%22%3Bs%3A32%3A%22534b3ff9fda2a5d294961250d665616c%22%3Bs%3A10%3A%22ip_address%22%3Bs%3A12%3A%22190.71.20.90%22%3Bs%3A10%3A%22user_agent%22%3Bs%3A21%3A%22PostmanRuntime%2F7.32.3%22%3Bs%3A13%3A%22last_activity%22%3Bi%3A1693110208%3Bs%3A9%3A%22user_data%22%3Bs%3A0%3A%22%22%3B%7D0c10c561169d4ead856f559b43ac951c7f1d4ad6; ci_session=a%3A5%3A%7Bs%3A10%3A%22session_id%22%3Bs%3A32%3A%221f11c4c850e528928da62549765b7a15%22%3Bs%3A10%3A%22ip_address%22%3Bs%3A12%3A%22190.71.20.90%22%3Bs%3A10%3A%22user_agent%22%3Bs%3A21%3A%22PostmanRuntime%2F7.43.4%22%3Bs%3A13%3A%22last_activity%22%3Bi%3A1746841421%3Bs%3A9%3A%22user_data%22%3Bs%3A0%3A%22%22%3B%7D14087dd8dbb87c93e0cebfd9e0b5e6f28ee5114c',
                    'Origin': 'https://siata.gov.co',
                    'Referer': 'https://siata.gov.co/siata_nuevo/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'X-Requested-With': 'XMLHttpRequest',
                    'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                },
                body: `id_capa=${LAYER_ID}`,
            });
            // console.log('Response status:', response.status); // Kept for debugging

            if (!response.ok) {
                // Attempt to get more error info from response body if possible
                let errorBody = '';
                try {
                    errorBody = await response.text();
                } catch (e) {
                    // Ignore if can't read body
                }
                throw new Error(`HTTP error! status: ${response.status}. ${errorBody}`);
            }

            const data: ApiResponse = await response.json();
            // console.log('Data received:', data); // Kept for debugging

            if (!data || !data.feature_vector) {
                throw new Error('Invalid data structure received from API.');
            }

            const sortedStations = data.feature_vector.sort((a, b) => {
                // Helper to safely parse float, defaulting to 0 if value is missing or not a number
                const getRainValue = (station: Station, key: string): number => {
                    const attribute = station.atributos.descripcion[key];
                    if (attribute && attribute.valor_alfanumerico) {
                        const parsed = parseFloat(attribute.valor_alfanumerico);
                        return isNaN(parsed) ? 0 : parsed;
                    }
                    return 0;
                };

                const rainA5m = getRainValue(a, 'D_5_m');
                const rainB5m = getRainValue(b, 'D_5_m');

                if (rainA5m !== rainB5m) {
                    return rainB5m - rainA5m; // Sorts in descending order of D_5_m
                }

                const rainA30D = getRainValue(a, 'D_30_D');
                const rainB30D = getRainValue(b, 'D_30_D');
                return rainB30D - rainA30D; // Then sorts in descending order of D_30_D
            });

            setStations(sortedStations);
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error('Error fetching stations:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false); // Ensure loading is set to false in both success and error cases
        }
    };

    // This useEffect hook runs once when the component mounts (page is loaded/opened).
    // It fetches the initial data and then sets up an interval for subsequent refreshes.
    useEffect(() => {
        // console.log('Component mounted, starting initial fetch...'); // Kept for debugging

        // Initial fetch when the component is loaded/page is opened
        fetchStations();

        // Set up the interval for periodic updates
        const intervalId = setInterval(() => {
            // console.log('Fetching stations on interval...'); // Kept for debugging
            fetchStations();
        }, REFRESH_INTERVAL);

        // Cleanup function: This will be called when the component unmounts.
        // It's important to clear the interval to prevent memory leaks.
        return () => {
            // console.log('Component unmounting, cleaning up interval...'); // Kept for debugging
            clearInterval(intervalId);
        };
    }, []); // Empty dependency array means this effect runs only once after the initial render (mount) and cleanup runs on unmount.

    if (loading && stations.length === 0) { // Show initial loading message only if there are no stations yet
        return <p className="loading">Cargando datos de las estaciones...</p>;
    }

    if (error) {
        return <p className="error">Error al cargar los datos: {error}</p>;
    }

    if (stations.length === 0 && !loading) { // Case where data is loaded, but no stations were returned
        return <p>No hay estaciones disponibles en este momento.</p>;
    }

    return (
        <div className="rain-stations">
            <h2>Estaciones Pluviométricas</h2>
            <p className="description">Mediciones de precipitación en tiempo real. {loading && stations.length > 0 && "(Actualizando...)"}</p>
            <div className="stations-grid">
                {stations.map((station) => (
                    <RainStationsCard key={station.id_feature_vector} station={station} />
                ))}
            </div>
        </div>
    );
}