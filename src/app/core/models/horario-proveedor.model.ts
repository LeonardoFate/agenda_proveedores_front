import { DiaSemana } from './plantilla-horario.model'

export interface HorarioProveedor {
  fecha: string;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  tiempoDescarga: string;
  numeroPersonas: number;
  areaNombre: string;
  andenNumero: number;
  tipoServicioNombre: string;
  tieneReserva: boolean;
  reservaId?: number;
  estadoReserva?: string;
  puedeConfirmar: boolean;
}
