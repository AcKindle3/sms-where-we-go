import { Operation } from 'express-openapi';
import { pg } from '..';
import { Service } from '../generated';
import { parseBody, sendError, sendSuccess } from '../utils';

export const post: Operation = (req, res, next) => {
    const data = parseBody<typeof Service.validate>(req);

    pg('wwg.registration_key').join('wwg.curriculum', 'wwg.curriculum.curriculum_uid', 'wwg.registration_key.curriculum_uid').select()
        .where('registration_key', data.registration_key)
        .where(
            'expiration_date', '>', new Date().toISOString()
        )
        .then((result) => {
            if (result.length > 0) {
                sendSuccess(res, {
                    'class_number': result[0].class_number,
                    'grad_year': result[0].grad_year,
                    'curriculum': result[0].name,
                    'expiration_date': result[0].expiration_date
                });
            }
            else {
                sendError(res, 200, 'The registration key is invalid');
            }
        });
}
