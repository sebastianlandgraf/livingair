export const globals = {
  weekdShortNames: {
    ge: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  weekdLongNames: {
    ge: [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ],
    en: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
  },
  monthsShortNames: {
    ge: [
      'Jan',
      'Feb',
      'Mrz',
      'Apr',
      'Mai',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Okt',
      'Nov',
      'Dez',
    ],
    en: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'July',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dez',
    ],
  },
  monthsLongNames: {
    ge: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
};

type Language = 'ge' | 'en';
const defaultLanguage: Language = 'ge';

export function getGlobals() {
  return {
    weekdShortNames: globals.weekdShortNames[defaultLanguage],
    weekdLongNames: globals.weekdLongNames[defaultLanguage],
    monthsShortNames: globals.monthsShortNames[defaultLanguage],
    monthsLongNames: globals.monthsLongNames[defaultLanguage],
  };
}
