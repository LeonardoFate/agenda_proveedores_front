import { DiaSemana } from '../../core/models/plantilla-horario.model';

export class DateUtils {
  static getDiaSemanaFromDate(date: Date): DiaSemana {
    const dias = [
      DiaSemana.DOMINGO,
      DiaSemana.LUNES,
      DiaSemana.MARTES,
      DiaSemana.MIERCOLES,
      DiaSemana.JUEVES,
      DiaSemana.VIERNES,
      DiaSemana.SABADO
    ];
    return dias[date.getDay()];
  }

  static getDiaSemanaFromString(dateString: string): DiaSemana {
    const date = new Date(dateString);
    return this.getDiaSemanaFromDate(date);
  }

  static formatTime(time: string): string {
    // Formatear tiempo de HH:mm:ss a HH:mm
    return time.substring(0, 5);
  }

  static getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  static getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }
}
