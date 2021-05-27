import { Operation } from 'express-openapi';
import hash from 'bcrypt';
import log4js from 'log4js';
import { pg } from '..';
import { Service } from '../generated';
import { parseBody, sendError, sendSuccess } from '../utils';
import { ClassService, RoleService, StudentService } from '../services';
import { StudentRole } from '../generated/schema';

export const get: Operation = async (req, res, next) => {

}

export const put: Operation = async (req, res, next) => {

}

//type: ignore
export const DELETE: Operation = async (req, res, next) => {
    const data = parseBody<typeof Service.deleteStudent>(req);
    const logger = log4js.getLogger('student.delete');

    if (!!!req.session.student_uid) {
        sendError(res, 403, 'Login to delete student');
    }

    const privilege = await RoleService.privilege(req.session.student_uid, data.student_uid);

    if (!privilege.delete) {
        sendError(res, 403, 'You are not authorized to delete this user');
    }

    pg('wwg.student')
        .delete()
        .where('student_uid', data.student_uid)
        .then((result) => {
            logger.info(result);
            if (result === 0) {
                sendSuccess(res, { message: 'No students affected' });
            }
            else {
                sendSuccess(res, { message: 'Successfully deleted the student' });
            }
        }).catch((err) => {
            logger.error(err);
            sendError(res, 400, 'Failed to delete the student');
        });
}

export const post: Operation = async (req, res, next) => {
    const data = parseBody<typeof Service.postStudent>(req);
    const logger = log4js.getLogger('register');

    const registrationInfo = (await pg('wwg.registration_key')
        .select()
        .where(
            'registration_key', data.registration_key
        )
        .where(
            'expiration_date', '>', new Date().toISOString()
        ) as any)[0];
    console.log(registrationInfo);
    if (!!!registrationInfo) {
        logger.info(`Invalid registration key "${data.registration_key}"`);
        sendError(res, 200, 'The registration key is invalid, please double-check or contact the administrator');
        return;
    }

    hash.hash(data.password, 10).then((hashed) => {
        pg('student').insert({
            name: data.name,
            phone_number: data.phone_number,
            email: data.email,
            password_hash: hashed,
            wxid: data.wxid,
            department: data.department,
            major: data.major,
            class_number: registrationInfo.class_number,
            grad_year: registrationInfo.grad_year,
            school_uid: data.school_uid,
        }).then((result) => {
            logger.info(`Successfully registered ${data.name} with the key "${data.registration_key}"`);
            sendSuccess(res);
        }).catch((err) => {
            const pattern = /\((.*)\)=\((.*)\)/;
            const matchGroup = err.detail.match(pattern);
            switch (err.code) {
                case "23505":
                    logger.error(err.detail);
                    sendError(res, 200, `The ${matchGroup[1]} "${matchGroup[2]}" has already been taken`);
                    break;
                case "23503":
                    logger.error(err.detail);
                    sendError(res, 200, `${matchGroup[2]} is not a existing ${matchGroup[1]}`);
                    break;
                default:
                    logger.error(err);
                    sendError(res, 200, `An unknown error just occured [code ${err.code ?? -1}]`);
            }
        });
    });
}
