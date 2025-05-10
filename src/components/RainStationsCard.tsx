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
    geometry_text: string;
    atributos: {
        descripcion: {
            [key: string]: StationAttribute;
        };
        grafico: {
            [key: string]: StationAttribute;
        };
        metadato: {
            [key: string]: StationAttribute;
        };
    };
}

interface Props {
    station: Station;
}

export default function RainStationsCard({ station }: Props) {
    return (
        <div className="card">
            <h3 className="title">
                {station.atributos.metadato.estacion?.titulo || "N/A"}
            </h3>
            <div className="data-item">
                Precipitación (5 min):{" "}
                {station.atributos.descripcion.D_5_m?.valor_alfanumerico || "N/A"} mm
            </div>
            <div className="data-item">
                Precipitación (30 días):{" "}
                {station.atributos.descripcion.D_30_D?.valor_alfanumerico || "N/A"} mm
            </div>
        </div>
    );
} 