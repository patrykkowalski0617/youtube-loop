import { messaging } from "../sync";

const UNKNOWN_VERSION = "";

export const extensionVersion = (): string => messaging()?.getManifest().version ?? UNKNOWN_VERSION;
