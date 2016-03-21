angular.module('travellapp').factory('AuthService',
    ['$q', '$timeout', '$http',
        function ($q, $timeout, $http) {

            // create user variable
            var user = null;

            // return available functions for use in controllers
            return ({
                isLoggedIn: isLoggedIn,
                getUser: getUser,
                login: login,
                logout: logout,
                register: register
            });

            function isLoggedIn() {
                if(user !== null) {
                    return true;
                } else {
                    return false;
                }
            }

            function getUser() {
                return user;
            }

            function register(username, password) {

                // create a new instance of deferred
                var deferred = $q.defer();

                // send a post request to the server
                $http.post('/user/register', {username: username, password: password})
                    // handle success
                    .success(function (data, status) {
                        if(status === 200){
                            user = data;
                            deferred.resolve();
                        } else {
                            user = null;
                            deferred.reject();
                        }
                    })
                    // handle error
                    .error(function (data) {
                        deferred.reject();
                    });

                // return promise object
                return deferred.promise;

            }

            function login(username, password) {

                // create a new instance of deferred
                var deferred = $q.defer();

                // send a post request to the server
                $http.post('/user/login', {username: username, password: password})
                    // handle success
                    .success(function (data, status) {
                        if(status === 200){
                            user = data;
                            deferred.resolve();
                        } else {
                            user = null;
                            deferred.reject();
                        }
                    })
                    // handle error
                    .error(function (data) {
                        user = null;
                        deferred.reject();
                    });

                // return promise object
                return deferred.promise;

            }

            function logout() {

                // create a new instance of deferred
                var deferred = $q.defer();

                // send a get request to the server
                $http.get('/user/logout')
                    // handle success
                    .success(function (data) {
                        user = null;
                        deferred.resolve();
                    })
                    // handle error
                    .error(function (data) {
                        user = null;
                        deferred.reject();
                    });

                // return promise object
                return deferred.promise;

            }


        }]);