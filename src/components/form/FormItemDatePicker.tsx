import { DatePickerInput, type DatePickerInputProps } from '@mantine/dates';
import {
  type FieldValues,
  useController,
  type UseControllerProps,
} from 'react-hook-form';

import { genControllerProps } from './util';

export type FormItemDatePickerProps<T extends FieldValues> =
  UseControllerProps<T> & DatePickerInputProps;

export const FormItemDatePicker = <T extends FieldValues>(
  props: FormItemDatePickerProps<T>
) => {
  const { controllerProps, restProps } = genControllerProps(props, '');

  const {
    field: { value, onChange: fOnChange, ...restField },
    fieldState,
  } = useController<T>(controllerProps);

  return (
    <DatePickerInput
      value={value || null}
      error={fieldState.error?.message}
      valueFormat="YYYY-MM-DD"
      onChange={(date) => {
        fOnChange(date);
        restProps.onChange?.(date);
      }}
      {...restField}
      {...restProps}
    />
  );
};
