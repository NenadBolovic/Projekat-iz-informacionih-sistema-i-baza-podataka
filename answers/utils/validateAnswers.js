export const validateAnswer = (questionType, value) => {
    switch (questionType) {
        case 'short-text':
            return typeof value === 'string' && value.length <= 512;
        case 'long-text':
            return typeof value === 'string' && value.length <= 4096;
        case 'multiple-choice-single':
            return typeof value === 'string';
        case 'multiple-choice-multiple':
            return Array.isArray(value) && value.every(item => typeof item === 'string');
        case 'numeric':
            return typeof value ==='number';
        case 'date':
            return value instanceof Date;
        case 'time':
            return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
        default:
            return false;
    }
};

export const validateAnswers = (answers) => {
    let allValid = true; 
    answers.forEach((answer) => {
        const { questionType, answer: answerValue, questionId } = answer;
        if (!validateAnswer(questionType, answerValue)) {
            allValid = false;
            console.error(`Invalid answer format for questionId ${questionId} with type ${questionType}`);
        }
    });

    return allValid ? 1 : 0; 
};