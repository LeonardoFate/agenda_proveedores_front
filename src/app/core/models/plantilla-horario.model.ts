export interface PlantillaHorario {
  id?: number;
  dia: DiaSemana;
  proveedorId: number;
  proveedorNombre?: string;
  numeroPersonas: number;
  horaInicio: string;
  horaFin: string;
  tiempoDescarga: string;
  areaId?: number;
  areaNombre?: string;
  andenId?: number;
  andenNumero?: number;
  tipoServicioId?: number;
  tipoServicioNombre?: string;
  activo?: boolean;
}

export enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO'
}

export interface ExcelUploadResponse {
  mensaje: string;
  plantillasCargadas: number;
  plantillas: PlantillaHorario[];
}

export interface TemplateStatistics {
  totalPlantillas: number;
  totalProveedores: number;
  distribucionPorDia: { [key: string]: number };
}
