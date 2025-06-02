// src/app/core/models/reserva.model.ts - ACTUALIZADO

export interface Reserva {
  id?: number;
  proveedorId: number;
  proveedorNombre?: string;
  areaId?: number;
  areaNombre?: string;
  andenId?: number;
  andenNumero?: number;
  tipoServicioId?: number;
  tipoServicioNombre?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  estado?: EstadoReserva;
  descripcion?: string;

  // ✅ CAMPO EXISTENTE
  numeroPalets?: number;

  // Datos de transporte
  transporteTipo: string;
  transporteMarca: string;
  transporteModelo: string;
  transportePlaca: string;
  transporteCapacidad?: string;

  // Datos del conductor
  conductorNombres: string;
  conductorApellidos: string;
  conductorCedula: string;

  // Ayudantes
  ayudantes?: Ayudante[];
}

export interface ReservaDetalle extends Reserva {
  createdAt?: string;
  updatedAt?: string;
}

export interface Ayudante {
  nombres: string;
  apellidos: string;
  cedula: string;
}

// ✅ ENUM ACTUALIZADO CON TODOS LOS ESTADOS
export enum EstadoReserva {
  PENDIENTE_CONFIRMACION = 'PENDIENTE_CONFIRMACION', // ✅ NUEVO
  CONFIRMADA = 'CONFIRMADA', // ✅ NUEVO
  PENDIENTE = 'PENDIENTE',
  EN_PLANTA = 'EN_PLANTA',
  EN_RECEPCION = 'EN_RECEPCION',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA' // ✅ ESTE FALTABA
}

export interface DisponibilidadAnden {
  andenId: number;
  numero: number;
  areaId: number;
  areaNombre: string;
  estadoActual: string;
  exclusivoContenedor: boolean;
  horariosReservados: HorarioReservado[];
}

export interface HorarioReservado {
  horaInicio: string;
  horaFin: string;
}
