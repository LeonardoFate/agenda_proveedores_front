// CREAR NUEVO ARCHIVO: src/app/core/models/confirmar-reserva.model.ts
import { Ayudante } from './reserva.model';

export interface ConfirmarReservaRequest {
  conductorNombres: string;
  conductorApellidos: string;
  conductorCedula: string;
  transportePlaca: string;
  transporteTipo: string;
  transporteMarca: string;
  transporteModelo: string;
  transporteCapacidad?: string;
  observaciones?: string;
  numeroPalets?: number;
  ayudantes?: Ayudante[];
}
