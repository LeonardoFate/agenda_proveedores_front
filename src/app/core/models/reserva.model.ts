export interface Ayudante {
    nombres: string;
    apellidos: string;
    cedula: string;
  }

  export interface Reserva {
    id?: number;
    proveedorId: number;
    proveedorNombre?: string;
    areaId: number;
    areaNombre?: string;
    andenId: number;
    andenNumero?: number;
    tipoServicioId: number;
    tipoServicioNombre?: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado?: 'PENDIENTE' | 'EN_PLANTA' | 'EN_RECEPCION' | 'COMPLETADA' | 'CANCELADA';
    descripcion?: string;
    transporteTipo: string;
    transporteMarca: string;
    transporteModelo: string;
    transportePlaca: string;
    transporteCapacidad?: string;
    conductorNombres: string;
    conductorApellidos: string;
    conductorCedula: string;
    ayudantes?: Ayudante[];
  }

  export interface ReservaDetalle extends Reserva {
    createdAt: string;
    updatedAt: string;
  }

  export interface DisponibilidadAnden {
    andenId: number;
    numero: number;
    areaId: number;
    areaNombre: string;
    estadoActual: string;
    exclusivoContenedor: boolean;
    horariosReservados: { horaInicio: string; horaFin: string }[];
  }
