
import { IoAdd, IoRemove } from 'react-icons/io5/';
import { MdFullscreen } from 'react-icons/md'
import { IoMdClose } from "react-icons/io";
import { BsFolder, BsFillPlayFill, BsShareFill } from 'react-icons/bs';
import { TiArrowSync } from "react-icons/ti";
import { FaLaptopCode } from "react-icons/fa6";
import { IoTerminal } from "react-icons/io5";
import { MdOutlineKeyboardHide } from "react-icons/md";
import { GoPaste } from "react-icons/go";
import { FcFile } from "react-icons/fc";
import { FcFolder } from "react-icons/fc";
import { PiCaretLeft } from 'react-icons/pi';
import { FaThList } from "react-icons/fa";

export const Add = IoAdd

export const Remove = IoRemove

export const Fullscreen = MdFullscreen

export const Close = IoMdClose

export const Play = BsFillPlayFill;

export const Share = BsShareFill;

export const Folder = BsFolder;

export const Sync = TiArrowSync;

export const Code = FaLaptopCode;

export const Terminal = IoTerminal;

export const Keyboard = MdOutlineKeyboardHide;

export const Paste = GoPaste;

export const Icons = {
    FileBrowser: {
        File: FcFile,
        Folder: FcFolder,
        Back: PiCaretLeft
    },
    NodeControls: {
        Options: FaThList
    }
}