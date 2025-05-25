// src/app/core/models/horario-proveedor.model.ts - ACTUALIZADO
import { DiaSemana } from './plantilla-horario.model'

export interface HorarioProveedor {
  fecha: string;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  tiempoDescarga: string;
  numeroPersonas: number;

  // ✅ NUEVOS CAMPOS: IDs necesarios para confirmación
  areaId: number;
  areaNombre: string;
  andenId: number;
  andenNumero: number;
  tipoServicioId: number;
  tipoServicioNombre: string;

  // Estados de reserva
  tieneReserva: boolean;
  reservaId?: number;
  estadoReserva?: string;
  puedeConfirmar: boolean;
}
