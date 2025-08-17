import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const FormSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    indicator: { type: Number, default: 0 },
    locked: { type: Number, default: 0 },
    authId: { type: Number, required: true },
    collaborators: { type: [Number], default: [] }, 
    observers: { type: [Number], default: [] },    
}, { timestamps: true });

export default model('Form', FormSchema,'formscollection');