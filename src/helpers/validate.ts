import { ValidatorProp } from "@/types/validate";

export const fieldRules: Record<string, ValidatorProp> = {
  id: {
    type: "number",
    name: "ID",
    coerce: true,
    int: true,
    min: 1,
  },
  username: {
    type: "string",
    name: "Username",
    create: true,
    update: true,
    min: 3,
    max: 50,
  },
  password: {
    type: "string",
    name: "Password",
    create: true,
    update: true,
    min: 3,
    max: 32,
  },
  email: {
    type: "string",
    name: "Email",
    create: true,
    min: 7,
    max: 100,
    email: true,
  },
  firstname: {
    type: "string",
    name: "Firstname",
    max: 100,
  },
  lastname: {
    type: "string",
    name: "Lastname",
    max: 100,
  },
  // role: {
  //   type: "string",
  //   name: "User role",
  //   create: true,
  //   oneOf: [UserRole.STAFF, UserRole.USER, UserRole.CUSTOMER],
  // },
  code: {
    type: "string",
    name: "Code",
    create: true,
    min: 2,
    max: 50,
  },
  name: {
    type: "string",
    name: "Name",
    create: true,
    min: 1,
    max: 200,
  },
  customer_name: {
    type: "string",
    name: "Customer name",
  },
  customer_email: {
    type: "string",
    name: "Customer email",
  },
  customer_date: {
    type: "string",
    name: "Customer date",
  },
  customer_price: {
    type: "number",
    name: "Customer price",
    coerce: true,
  }
};
