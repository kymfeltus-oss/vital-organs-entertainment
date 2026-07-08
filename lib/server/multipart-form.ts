/** Web multipart form with React Native–compatible typing in this monorepo. */
export type MultipartForm = {
  get(name: string): FormDataEntryValue | null;
};

export function asMultipartForm(formData: unknown): MultipartForm {
  return formData as MultipartForm;
}
