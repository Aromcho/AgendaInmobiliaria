import { Schema, model } from 'mongoose';

const receptionSchema = new Schema(
  {
    num: { type: Number, required: true, index: true },
    responsable: { type: String, default: '', index: true },
    respColor: { type: String, default: '#15784f' },
    respInit: { type: String, default: 'A' },
    owner: { type: String, default: '' },
    phone: { type: String, default: '' },
    fecha: { type: String, default: '' },
    propiedad: { type: String, required: true, index: true },
    valor: { type: String, default: '' },
    tasacion: { type: String, default: '' },
    autorizacion: { type: String, default: '' },
    cartel: { type: String, default: '' },
    fotos: { type: String, default: '' },
    descripcion: { type: String, default: '' },
    status: { type: String, default: 'celeste', index: true },
    link: { type: String, default: '' },
    steps: {
      tasacion: { type: String, default: 'missing' },
      autorizacion: { type: String, default: 'missing' },
      cartel: { type: String, default: 'missing' },
      fotos: { type: String, default: 'missing' },
      descripcion: { type: String, default: 'missing' },
    },
    flags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default model('Reception', receptionSchema);
