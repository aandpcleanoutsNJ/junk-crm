export type Lang = "en" | "es";

export const LANG_COOKIE_NAME = "junkcrm_lang";
export const DEFAULT_LANG: Lang = "en";

export const LANGS: Lang[] = ["en", "es"];

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "es";
}

export interface Dict {
  common: {
    back: string;
    cancel: string;
    loading: string;
  };
  errors: {
    generic: string;
    network: string;
    dbNotConnected: string;
    blobNotConnected: string;
    authNotConnected: string;
    wrongPin: string;
    pleaseLogin: string;
    jobNotFound: string;
    photoNotFound: string;
    missingJobDetails: string;
    nameRequired: string;
    jobValueInvalid: string;
    noPhotosToAdd: string;
    noPhotoSent: string;
    noPhotoUrl: string;
    couldNotUploadPhoto: string;
    couldNotLoadJobs: string;
    couldNotLoadJob: string;
    couldNotUpdate: string;
    couldNotRemovePhoto: string;
    couldNotAddPhotos: string;
    couldNotUploadGeneric: string;
    couldNotSave: string;
  };
  login: {
    enterPin: string;
  };
  home: {
    newJob: string;
    calendar: string;
    notPaidLabel: string;
    unpaidHint: string;
    searchPlaceholder: string;
    loadingJobs: string;
    noJobsYet: string;
    noJobsMatch: string;
    noAddress: string;
    paidBadge: string;
    notPaidBadge: string;
    statusOpen: string;
    statusDone: string;
  };
  jobForm: {
    newJobTitle: string;
    editJobTitle: string;
    customerName: string;
    phone: string;
    emailOptional: string;
    customerAddress: string;
    differentAddressToggle: string;
    jobAddress: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    micHint: string;
    jobValueLabel: string;
    scheduledDateLabel: string;
    paidQuestion: string;
    notPaidButton: string;
    paidButton: string;
    photosLabel: string;
    saveJob: string;
    savingEllipsis: string;
  };
  addressFields: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  photoPicker: {
    takeAddPhotos: string;
    uploading: string;
    couldntUpload: string;
    removePhotoConfirm: string;
    jobPhotoAlt: string;
  };
  confirmDialog: {
    yesRemove: string;
  };
  jobDetail: {
    call: string;
    noCustomerAddress: string;
    jobLocation: string;
    getDirections: string;
    descriptionHeading: string;
    jobValueHeading: string;
    markNotPaid: string;
    markPaid: string;
    paidOn: string;
    photosHeading: string;
    beforePhotosHeading: string;
    afterPhotosHeading: string;
    addMorePhotos: string;
    addBeforePhotos: string;
    addAfterPhotos: string;
    editButton: string;
    markDone: string;
    reopen: string;
    scheduledFor: string;
    shareButton: string;
    enlargeAlt: string;
    removePhotoAria: string;
    jobSaved: string;
  };
  shareModal: {
    title: string;
    dateLabel: string;
    share: string;
    download: string;
    close: string;
    preparing: string;
    notSupportedHint: string;
    shareFailed: string;
  };
  calendar: {
    title: string;
    previousMonth: string;
    nextMonth: string;
    noJobsThisDay: string;
    jobsOn: string;
    backToList: string;
  };
}

const en: Dict = {
  common: {
    back: "Back",
    cancel: "Cancel",
    loading: "Loading…",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "Couldn't connect. Check your internet and try again.",
    dbNotConnected: "Not connected yet. Ask the admin to finish setup in Vercel.",
    blobNotConnected:
      "Photo storage isn't connected yet. Ask the admin to finish setup in Vercel.",
    authNotConnected:
      "Not connected yet. Ask the admin to add APP_PIN and SESSION_SECRET in Vercel.",
    wrongPin: "Wrong PIN. Try again.",
    pleaseLogin: "Please log in again.",
    jobNotFound: "Job not found.",
    photoNotFound: "Photo not found.",
    missingJobDetails: "Missing job details.",
    nameRequired: "Please enter the customer's name.",
    jobValueInvalid: "Job value must be a number.",
    noPhotosToAdd: "No photos to add.",
    noPhotoSent: "No photo was sent.",
    noPhotoUrl: "No photo url given.",
    couldNotUploadPhoto: "Could not upload photo. Please try again.",
    couldNotLoadJobs: "Couldn't load jobs. Check your internet connection.",
    couldNotLoadJob: "Couldn't load job. Check your internet connection.",
    couldNotUpdate: "Couldn't update. Please try again.",
    couldNotRemovePhoto: "Couldn't remove photo.",
    couldNotAddPhotos: "Couldn't add photos.",
    couldNotUploadGeneric: "Couldn't upload photo.",
    couldNotSave: "Couldn't save. Check your internet connection and try again.",
  },
  login: {
    enterPin: "Enter PIN",
  },
  home: {
    newJob: "New Job",
    calendar: "Calendar",
    notPaidLabel: "Not paid:",
    unpaidHint: "(showing unpaid only, tap to clear)",
    searchPlaceholder: "Search name, phone, or address",
    loadingJobs: "Loading jobs…",
    noJobsYet: "No jobs yet. Tap + New Job to add one.",
    noJobsMatch: "No jobs match.",
    noAddress: "No address",
    paidBadge: "PAID",
    notPaidBadge: "NOT PAID",
    statusOpen: "Open",
    statusDone: "Done",
  },
  jobForm: {
    newJobTitle: "New Job",
    editJobTitle: "Edit Job",
    customerName: "Customer name",
    phone: "Phone",
    emailOptional: "Email (optional)",
    customerAddress: "Customer address",
    differentAddressToggle: "Job is at a different address",
    jobAddress: "Job address",
    descriptionLabel: "Description of work",
    descriptionPlaceholder: "What needs to be done?",
    micHint: "Tap the microphone on your keyboard to talk instead of typing.",
    jobValueLabel: "Job value",
    scheduledDateLabel: "Scheduled date (optional)",
    paidQuestion: "Paid?",
    notPaidButton: "Not Paid",
    paidButton: "Paid",
    photosLabel: "Photos",
    saveJob: "Save Job",
    savingEllipsis: "Saving…",
  },
  addressFields: {
    street: "Street",
    city: "City",
    state: "State",
    zip: "Zip",
  },
  photoPicker: {
    takeAddPhotos: "Take / Add Photos",
    uploading: "Uploading…",
    couldntUpload: "Couldn't upload",
    removePhotoConfirm: "Remove this photo?",
    jobPhotoAlt: "Job photo",
  },
  confirmDialog: {
    yesRemove: "Yes, Remove",
  },
  jobDetail: {
    call: "Call",
    noCustomerAddress: "No customer address",
    jobLocation: "Job location",
    getDirections: "Get Directions",
    descriptionHeading: "Description",
    jobValueHeading: "Job value",
    markNotPaid: "Mark Not Paid",
    markPaid: "Mark Paid",
    paidOn: "Paid on",
    photosHeading: "Photos",
    beforePhotosHeading: "Before Photos",
    afterPhotosHeading: "After Photos",
    addMorePhotos: "Add More Photos",
    addBeforePhotos: "Add Before Photos",
    addAfterPhotos: "Add After Photos",
    editButton: "Edit",
    markDone: "Mark Done",
    reopen: "Reopen",
    scheduledFor: "Scheduled for",
    shareButton: "Share",
    enlargeAlt: "Enlarge photo",
    removePhotoAria: "Remove photo",
    jobSaved: "Job saved ✓",
  },
  shareModal: {
    title: "Share Photo",
    dateLabel: "Date on photo",
    share: "Share",
    download: "Download Photo",
    close: "Close",
    preparing: "Preparing…",
    notSupportedHint:
      "Sharing isn't supported on this device. The photo will download instead — you can attach it in your messages app.",
    shareFailed: "Couldn't share the photo. Try again.",
  },
  calendar: {
    title: "Calendar",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    noJobsThisDay: "No jobs scheduled",
    jobsOn: "Jobs on",
    backToList: "Back to list",
  },
};

const es: Dict = {
  common: {
    back: "Atrás",
    cancel: "Cancelar",
    loading: "Cargando…",
  },
  errors: {
    generic: "Algo salió mal. Inténtalo de nuevo.",
    network: "No se pudo conectar. Revisa tu internet e inténtalo de nuevo.",
    dbNotConnected:
      "Aún no está conectado. Pídele al administrador que termine la configuración en Vercel.",
    blobNotConnected:
      "El almacenamiento de fotos aún no está conectado. Pídele al administrador que termine la configuración en Vercel.",
    authNotConnected:
      "Aún no está conectado. Pídele al administrador que agregue APP_PIN y SESSION_SECRET en Vercel.",
    wrongPin: "PIN incorrecto. Inténtalo de nuevo.",
    pleaseLogin: "Por favor inicia sesión de nuevo.",
    jobNotFound: "Trabajo no encontrado.",
    photoNotFound: "Foto no encontrada.",
    missingJobDetails: "Faltan los datos del trabajo.",
    nameRequired: "Por favor ingresa el nombre del cliente.",
    jobValueInvalid: "El valor del trabajo debe ser un número.",
    noPhotosToAdd: "No hay fotos para agregar.",
    noPhotoSent: "No se envió ninguna foto.",
    noPhotoUrl: "No se dio la URL de la foto.",
    couldNotUploadPhoto: "No se pudo subir la foto. Inténtalo de nuevo.",
    couldNotLoadJobs: "No se pudieron cargar los trabajos. Revisa tu conexión a internet.",
    couldNotLoadJob: "No se pudo cargar el trabajo. Revisa tu conexión a internet.",
    couldNotUpdate: "No se pudo actualizar. Inténtalo de nuevo.",
    couldNotRemovePhoto: "No se pudo quitar la foto.",
    couldNotAddPhotos: "No se pudieron agregar las fotos.",
    couldNotUploadGeneric: "No se pudo subir la foto.",
    couldNotSave: "No se pudo guardar. Revisa tu conexión a internet e inténtalo de nuevo.",
  },
  login: {
    enterPin: "Ingresa el PIN",
  },
  home: {
    newJob: "Nuevo Trabajo",
    calendar: "Calendario",
    notPaidLabel: "No pagado:",
    unpaidHint: "(mostrando solo no pagados, toca para quitar el filtro)",
    searchPlaceholder: "Buscar nombre, teléfono o dirección",
    loadingJobs: "Cargando trabajos…",
    noJobsYet: "Aún no hay trabajos. Toca + Nuevo Trabajo para agregar uno.",
    noJobsMatch: "Ningún trabajo coincide.",
    noAddress: "Sin dirección",
    paidBadge: "PAGADO",
    notPaidBadge: "NO PAGADO",
    statusOpen: "Abierto",
    statusDone: "Terminado",
  },
  jobForm: {
    newJobTitle: "Nuevo Trabajo",
    editJobTitle: "Editar Trabajo",
    customerName: "Nombre del cliente",
    phone: "Teléfono",
    emailOptional: "Correo electrónico (opcional)",
    customerAddress: "Dirección del cliente",
    differentAddressToggle: "El trabajo está en una dirección diferente",
    jobAddress: "Dirección del trabajo",
    descriptionLabel: "Descripción del trabajo",
    descriptionPlaceholder: "¿Qué hay que hacer?",
    micHint: "Toca el micrófono de tu teclado para hablar en lugar de escribir.",
    jobValueLabel: "Valor del trabajo",
    scheduledDateLabel: "Fecha programada (opcional)",
    paidQuestion: "¿Pagado?",
    notPaidButton: "No Pagado",
    paidButton: "Pagado",
    photosLabel: "Fotos",
    saveJob: "Guardar Trabajo",
    savingEllipsis: "Guardando…",
  },
  addressFields: {
    street: "Calle",
    city: "Ciudad",
    state: "Estado",
    zip: "Código Postal",
  },
  photoPicker: {
    takeAddPhotos: "Tomar / Agregar Fotos",
    uploading: "Subiendo…",
    couldntUpload: "No se pudo subir",
    removePhotoConfirm: "¿Quitar esta foto?",
    jobPhotoAlt: "Foto del trabajo",
  },
  confirmDialog: {
    yesRemove: "Sí, Quitar",
  },
  jobDetail: {
    call: "Llamar",
    noCustomerAddress: "Sin dirección del cliente",
    jobLocation: "Ubicación del trabajo",
    getDirections: "Cómo Llegar",
    descriptionHeading: "Descripción",
    jobValueHeading: "Valor del trabajo",
    markNotPaid: "Marcar No Pagado",
    markPaid: "Marcar Pagado",
    paidOn: "Pagado el",
    photosHeading: "Fotos",
    beforePhotosHeading: "Fotos de Antes",
    afterPhotosHeading: "Fotos de Después",
    addMorePhotos: "Agregar Más Fotos",
    addBeforePhotos: "Agregar Fotos de Antes",
    addAfterPhotos: "Agregar Fotos de Después",
    editButton: "Editar",
    markDone: "Marcar Terminado",
    reopen: "Reabrir",
    scheduledFor: "Programado para",
    shareButton: "Compartir",
    enlargeAlt: "Ampliar foto",
    removePhotoAria: "Quitar foto",
    jobSaved: "Trabajo guardado ✓",
  },
  shareModal: {
    title: "Compartir Foto",
    dateLabel: "Fecha en la foto",
    share: "Compartir",
    download: "Descargar Foto",
    close: "Cerrar",
    preparing: "Preparando…",
    notSupportedHint:
      "Compartir no es compatible con este dispositivo. La foto se descargará y podrás adjuntarla en tu app de mensajes.",
    shareFailed: "No se pudo compartir la foto. Inténtalo de nuevo.",
  },
  calendar: {
    title: "Calendario",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    noJobsThisDay: "No hay trabajos programados",
    jobsOn: "Trabajos el",
    backToList: "Volver a la lista",
  },
};

const dictionaries: Record<Lang, Dict> = { en, es };

export function getDict(lang: Lang): Dict {
  return dictionaries[lang];
}
