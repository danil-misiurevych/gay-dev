/**
 * Granice swiata gry wyliczone z proporcji ekranu.
 *
 * Zalozenie projektowe: gra musi wygladac tak samo na telefonie w pionie
 * (aspect ~0.46) i na desktopie (aspect ~1.8). Zamiast stalej odleglosci
 * kamery trzymamy stala minimalna SZEROKOSC widocznego swiata i cofamy
 * kamere tak, zeby sie zmiescila. Bez tego na telefonie pole gry robi sie
 * waskim kominem i obiekty wylatuja poza ekran.
 */
export const MIN_HALF_HEIGHT = 6;
export const MIN_HALF_WIDTH = 5.2;
export const CAMERA_FOV = 50;

export function computeBounds(aspect) {
  const a = Math.max(aspect, 0.001);
  const halfH = Math.max(MIN_HALF_HEIGHT, MIN_HALF_WIDTH / a);
  const halfW = halfH * a;
  return {
    aspect: a,
    halfW,
    halfH,
    /** Ponizej tego Y obiekt uznajemy za nietrafiony. */
    killY: -halfH - 2.2,
    /** Odleglosc kamery od plaszczyzny z = 0 dla powyzszych granic. */
    cameraZ: halfH / Math.tan((CAMERA_FOV / 2) * Math.PI / 180),
  };
}
