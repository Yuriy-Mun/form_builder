import { useFormMetaStore } from './form-meta-store';
import { useFormFieldsStore } from './form-fields-store';

/**
 * Загружает данные формы и поля
 */
export const loadFormWithFields = async (formId: string) => {
  const fetchForm = useFormMetaStore.getState().fetchForm;
  const fetchFormFields = useFormFieldsStore.getState().fetchFormFields;
  
  // Запускаем параллельную загрузку данных
  await Promise.all([
    fetchForm(formId),
    fetchFormFields(formId)
  ]);
};

/**
 * Создает новое поле формы
 */
export const createFormField = async (formId: string, fieldType: string) => {
  const addField = useFormFieldsStore.getState().addField;
  return await addField(formId, fieldType);
};

/**
 * Проверяет, загружены ли данные формы и поля
 */
export const isFormDataLoaded = () => {
  const metaLoading = useFormMetaStore.getState().loading;
  const fieldsLoading = useFormFieldsStore.getState().loading;
  const form = useFormMetaStore.getState().form;
  
  return !metaLoading && !fieldsLoading && form !== null;
};

/**
 * Получает объединенные ошибки из всех хранилищ
 */
export const getFormErrors = () => {
  const metaError = useFormMetaStore.getState().error;
  const fieldsError = useFormFieldsStore.getState().error;
  
  if (metaError) return metaError;
  if (fieldsError) return fieldsError;
  return null;
}; 