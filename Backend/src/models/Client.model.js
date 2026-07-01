import { Schema, model } from 'mongoose';

const clientSchema = new Schema(
  {
    agentId: { type: String, default: 'a1', index: true },
    fecha: { type: String, default: '' },
    cliente: { type: String, required: true, index: true },
    telefono: { type: String, default: '' },
    email: { type: String, default: '' },
    busca: { type: String, default: '' },
    presupuesto: { type: String, default: '' },
    // Cada ítem soporta el texto suelto viejo (String) o el objeto nuevo
    // { text, propertyRef, propertyPreview } con la propiedad anclada a ese ofrecimiento
    ofreci: { type: [Schema.Types.Mixed], default: [] },
    color: { type: String, default: '' },
    emoji: { type: String, default: '' },
    createdBy: { type: String, default: '', index: true },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model('Client', clientSchema);
