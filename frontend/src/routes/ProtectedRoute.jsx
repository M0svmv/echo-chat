import {useSelector} from 'react-redux';
import {Navigate} from 'react-router-dom';

export default function ProtectedRoute({children}) {
    const { user, initialized } = useSelector((state) => state.auth);

    // While auth initialization (hydration/refresh) is in progress, don't redirect.
    if (!initialized) {
        return null; // or a spinner component while checking auth
    }

    if(!user) {
        return <Navigate to='/login' />
    }
    return children;
}