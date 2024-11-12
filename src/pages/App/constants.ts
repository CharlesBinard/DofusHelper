import craImg from '../../assets/classes/cra.webp';
import iopImg from '../../assets/classes/iop.webp';
import sacrieurImg from '../../assets/classes/sacrieur.webp';
import eniripsaImg from '../../assets/classes/eniripsa.webp';
import ouginakimg from '../../assets/classes/ouginak.webp';
import fecaImg from '../../assets/classes/feca.png';
import enutrofImg from '../../assets/classes/enutrof.webp';
import sramImg from '../../assets/classes/sram.webp';
import forgelanceImg from '../../assets/classes/forgelance.png';
import zobalImg from '../../assets/classes/zobal.webp';
import pandawaImg from '../../assets/classes/pandawa.webp';
import sadidaImg from '../../assets/classes/sadida.webp';
import osamodasImg from '../../assets/classes/osamodas.webp';
import steamerImg from '../../assets/classes/steamer.png';
import huppermageImg from '../../assets/classes/huppermage.webp';
import ecaflipImg from '../../assets/classes/ecaflip.webp';
import roublardImg from '../../assets/classes/roublard.webp';
import eliotropeImg from '../../assets/classes/eliotrope.webp';
import xelorImg from '../../assets/classes/xelor.webp';
import unknownImg from '../../assets/classes/unknown.png';

export const CLASSES_IMAGES: Record<string, string> = {
    iop: iopImg,
    cra: craImg,
    sacrieur: sacrieurImg,
    eniripsa: eniripsaImg,
    ouginak: ouginakimg,
    feca: fecaImg,
    enutrof: enutrofImg,
    sram: sramImg,
    forgelance: forgelanceImg,
    zobal: zobalImg,
    pandawa: pandawaImg,
    sadida: sadidaImg,
    osamodas: osamodasImg,
    steamer: steamerImg,
    huppermage: huppermageImg,
    ecaflip: ecaflipImg,
    roublard: roublardImg,
    eliotrope: eliotropeImg,
    xelor: xelorImg,
    unknown: unknownImg,
    beta: unknownImg,
  };
  
export const DEFAULT_SHORTCUTS = {
    next: 'CommandOrControl+Shift+N',
    prev: 'CommandOrControl+Shift+P',
    click_all: 'Ctrl+Alt+C',
    click_all_with_delay: 'Ctrl+Alt+Shift+C',
  };

export type ShortcutAction = 'next' | 'prev' | 'click_all' | 'click_all_with_delay';