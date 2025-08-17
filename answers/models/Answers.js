import mongoose from 'mongoose';

const { Schema, model } = mongoose;


const AnswerSchema = new Schema(
  {
    userId: { type: Number, required: true }, 
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
    questionId: { type: Number, required: true },
    questionType: { 
      type: String, 
      required: true, 
      enum: ['short-text', 'long-text', 'multiple-choice-single', 'multiple-choice-multiple', 'numeric', 'date', 'time'] 
    },
    required: { type: Boolean, default: false }, 
    answer: { 
      type: Schema.Types.Mixed, 
      required: function () { return this.required; }, 
      validate: {
        validator: function (value) {
          if (!this.required && (value === null || value === undefined || value === '')) {
            return true; 
          }

          switch (this.questionType) {
            case 'short-text':
              return typeof value === 'string' && value.length <= 512;
            case 'long-text':
              return typeof value === 'string' && value.length <= 4096;
            case 'multiple-choice-single':
              return typeof value === 'string';
            case 'multiple-choice-multiple':
              return Array.isArray(value) && value.every(item => typeof item === 'string');
            case 'numeric':
              return typeof value === 'number';
            case 'date':
              return value instanceof Date;
            case 'time':
              return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
            default:
              return false;
          }
        },
        message: props => `Invalid answer format for question type: ${props.instance.questionType}`
      }
    }, 
    answerImage: { type: String, default: null }, 
  },
  { timestamps: true }
);

export default model('Answer', AnswerSchema, 'answerscollection');

