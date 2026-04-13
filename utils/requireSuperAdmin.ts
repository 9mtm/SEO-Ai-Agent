import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import db from '../database/database';
import verifyUser from './verifyUser';
import User from '../database/models/user';

export const getServerSideProps: GetServerSideProps = async (ctx: GetServerSidePropsContext) => {
    try { await db.sync(); } catch { }

    const { req, res } = ctx;
    const auth = verifyUser(req as any, res as any);

    if (!auth.authorized || !auth.userId) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    const user: any = await User.findByPk(auth.userId);
    if (!user || !user.is_super_admin) {
        return { redirect: { destination: '/', permanent: false } };
    }

    return { props: { adminUser: { id: user.id, name: user.name, email: user.email } } };
};
