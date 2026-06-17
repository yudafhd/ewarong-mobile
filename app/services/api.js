/* eslint-disable arrow-parens */
import _ from 'lodash';
import { Alert } from 'react-native';
import EndPoints from '../constants/endPoints';

const insertFormData = (formData, key, value) => {
  if (_.isPlainObject(value)) {
    if (value.uri && value.type) {
      formData.append(key, value);
    } else {
      _.forEach(value, (v2, k2) => {
        insertFormData(formData, `${key}[${k2}]`, v2);
      });
    }
  } else if (_.isArray(value)) {
    _.forEach(value, (v2) => {
      insertFormData(formData, `${key}[]`, v2);
    });
  } else {
    formData.append(key, value);
  }
};

const transformFormData = (data) => {
  const form = new FormData();
  _.forEach(data, (v, k) => {
    insertFormData(form, k, v);
  });
  return form;
};

const api = (getState, dispatch, endPoint, method = 'get', params, headers) => {
  let headersData = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (getState) {
    const { token } = getState().session;
    headersData = {
      Authorization: token ? `Bearer ${token}` : '',
      ...headersData,
    };
  }

  const optionData = {
    method,
    url: `${EndPoints.BASE_URL}${endPoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...headersData,
    },

    params: method === 'get' ? params : {},
    data: method === 'post' || method === 'put' ? params : undefined,
    transformRequest: [
      (requestData, requestHeaders) => {
        if (requestHeaders['Content-Type'] === 'multipart/form-data') {
          return transformFormData(requestData);
        }
        return JSON.stringify(params);
      },
    ],
  };
  console.log(optionData);

  // Build fetch options
  const fetchOptions = {
    method: optionData.method.toUpperCase(),
    headers: optionData.headers,
  };

  // Add body for POST/PUT requests
  if (optionData.data) {
    fetchOptions.body = optionData.transformRequest[0](
      optionData.data,
      optionData.headers,
    );
  }

  // Build URL with query params for GET requests
  let url = optionData.url;
  if (optionData.params && Object.keys(optionData.params).length > 0) {
    const queryString = new URLSearchParams(optionData.params).toString();
    url = `${url}?${queryString}`;
  }

  return fetch(url, fetchOptions)
    .then((response) => {
      console.log('inside api js', response);
      if (!response.ok) {
        return response.json().then((data) => {
          throw data;
        });
      }
      return response.json();
    })
    .catch((error) => {
      const message = error.message || JSON.stringify(error);
      Alert.alert('Error', message);
      throw new Error(error);
    });
};

export default api;
