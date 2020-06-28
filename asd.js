/* global fetch */

self.addEventListener('push', function(e) {
    var FEED_URL = 'https://feed.pushmart.net/feed.php?v=1590882433&ep=';
    var promise, data, options;

    if (e.data) {
        data = e.data.json();
        options = {
            requireInteraction: true,
            vibrate: [100, 50, 100],
            data: {
                destination: data.destination
            }
        };

        ['body', 'icon', 'image', 'badge'].forEach(function (prop) {
            if (data[prop]) {
                options[prop] = data[prop];
            }
        });

        promise = Promise.resolve({
            title: data.title,
            pixels: data.pixel ? [data.pixel] : [],
            options: options
        });
    } else {
        promise = self.registration.pushManager.getSubscription()
            .then(function (sub) {
                var url = FEED_URL + encodeURIComponent(sub.endpoint) +
                    '&t=' + new Date().valueOf();

                return fetch(url, { redirect: 'follow'})
                    .then(function (response) {
                        return response.json();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    }

    promise = promise.then(function (params) {
        var promises = [
            self.registration.showNotification(params.title, params.options)
        ];

        params.pixels.forEach(function (pixel) {
            promises.push(fetch(pixel, { redirect: 'follow' }));
        });

        return Promise.all(promises);
    });

    e.waitUntil(promise);
});

self.addEventListener('notificationclick', function (e) {
    var notification = e.notification;
    var action = e.action;

    if (action === 'close') {
        notification.close();
    } else {
        if (notification.data.destination) {
            self.clients.openWindow(notification.data.destination);
        }
        notification.close();
    }
});
