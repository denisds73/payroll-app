import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsMonthString(validationOptions?: ValidationOptions) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isMonthString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in YYYY-MM format`;
        },
      },
    });
  };
}
