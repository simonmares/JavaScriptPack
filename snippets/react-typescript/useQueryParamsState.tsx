import { useRouter } from 'next/router'
import queryString from 'query-string'
import React from 'react'
import { useStableShallowParams } from './useStableShallowParams'

/**
 * @overview
 *
 * API: type QueryParamsState + hook useQueryParamsState
 *
 * A helper hook based on Next's router to persist shallow object state to query params.
 *
 * Usage: It makes table pages more usable as they can be reloaded and will show the same data.
 */

type StringOnlyParams = Record<string, string | number | boolean>

// @review: consider to also persist non-strings => extend API to map between raw string values and actual values (could be messy, add new API hook maybe to override this one)
export type QueryParamsState<T extends StringOnlyParams> = {
  setParams: (params: T) => void
  patchParams: (params: Partial<T>) => void
  params: T
  paramsLoaded: boolean
}

export function useQueryParamsState<T extends StringOnlyParams>(options: {
  fallbackState: T
}): QueryParamsState<T> {
  const router = useRouter()
  const fallbackStateStable = useStableShallowParams(options.fallbackState)
  const [paramsState, setParamsState] = React.useState<T>(fallbackStateStable)

  // feat: set initial state once router.isReady is true + change state automatically on fallbackState deep change
  React.useEffect(() => {
    if (router.isReady) {
      setParamsState({
        ...fallbackStateStable,
        ...router.query,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, fallbackStateStable])

  const persistParams = React.useCallback(
    value => {
      const query = queryString.stringify(value)
      const url = `${window.location.pathname}?${query}`
      router.push(url, url, {
        // shallow: true,
      })
    },
    [router]
  )

  const setParams = React.useCallback(
    (value: T) => {
      const result = { ...value }

      // feat: remove undefined values from the object (query params serialization works like this)
      for (const key of Object.keys(result)) {
        const keyValue = result[key]
        if (keyValue == null || keyValue === '') {
          delete result[key]
        }
      }

      setParamsState(result)
      persistParams(result)
    },
    [persistParams]
  )

  const patchParams = React.useCallback(
    (patchValue: Partial<T>) => {
      const result = { ...paramsState, ...patchValue }
      setParams(result)
    },
    [paramsState, setParams]
  )

  const paramsLoaded = router.isReady

  return React.useMemo<QueryParamsState<T>>(() => {
    return {
      params: paramsState,
      setParams,
      patchParams,
      paramsLoaded,
    }
  }, [paramsState, setParams, patchParams, paramsLoaded])
}
